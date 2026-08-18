import express from 'express'
import http from 'http'
import { WebSocketServer } from 'ws'
import path from 'path'
import { fileURLToPath } from 'url'
import { loadMenu, saveMenu } from './menu-data.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const DIST_DIR = path.join(__dirname, '..', 'dist')

const app = express()
const server = http.createServer(app)
const wss = new WebSocketServer({ server, path: '/ws' })

let menu = loadMenu()

let orders = []
let nextId = 1
let comandaStatus = {}

const devices = new Map()
let nextDeviceId = 1

const KITCHEN_PIN = process.env.KITCHEN_PIN || '1234'

const KITCHEN_ONLY = [
  'add_item',
  'update_item',
  'remove_item',
  'add_category',
  'remove_category',
  'kick',
  'update_status',
  'close_comanda',
  'confirm_payment'
]

function isKitchen(socket) {
  return devices.get(socket)?.role === 'kitchen'
}

function broadcast(type, payload, except) {
  const msg = JSON.stringify({ type, payload })
  for (const client of wss.clients) {
    if (client !== except && client.readyState === 1) {
      client.send(msg)
    }
  }
}

function send(socket, type, payload) {
  if (socket.readyState === 1) {
    socket.send(JSON.stringify({ type, payload }))
  }
}

function getComandas() {
  const map = {}
  for (const o of orders) {
    const status = comandaStatus[o.table]
    if (status === 'paid') continue
    if (!map[o.table]) {
      map[o.table] = {
        table: o.table,
        status: status || 'open',
        customerName: o.customerName,
        items: [],
        total: 0,
        orderCount: 0,
        updatedAt: o.createdAt
      }
    }
    const c = map[o.table]
    for (const it of o.items) {
      const existing = c.items.find((i) => i.id === it.id)
      if (existing) existing.qty += it.qty
      else c.items.push({ ...it })
    }
    c.total += o.total
    c.orderCount += 1
    c.updatedAt = Math.max(c.updatedAt, o.createdAt)
  }
  return Object.values(map).sort((a, b) =>
    String(a.table).localeCompare(String(b.table), 'pt-BR', { numeric: true })
  )
}

function pushComandas(except) {
  broadcast('comandas', { comandas: getComandas() }, except)
}

function pushMenu(except) {
  broadcast('menu', { menu }, except)
}

function pushDevices() {
  const list = Array.from(devices.values()).map(({ id, role, label, connectedAt }) => ({
    id,
    role,
    label,
    connectedAt
  }))
  for (const socket of devices.keys()) {
    if (devices.get(socket).role === 'kitchen') {
      send(socket, 'devices', { devices: list })
    }
  }
}

wss.on('connection', (socket) => {
  send(socket, 'sync', {
    orders,
    comandas: getComandas(),
    comandaStatus,
    menu
  })

  socket.on('close', () => {
    if (devices.delete(socket)) pushDevices()
  })

  socket.on('message', (raw) => {
    let data
    try {
      data = JSON.parse(raw)
    } catch {
      return
    }
    const p = data.payload || {}

    if (data.type === 'identify') {
      const role = p.role === 'kitchen' ? 'kitchen' : 'client'
      if (role === 'kitchen' && String(p.pin) !== KITCHEN_PIN) {
        send(socket, 'auth_error', {
          message: 'PIN incorreto. Acesso ao painel negado.'
        })
        return
      }
      devices.set(socket, {
        id: String(nextDeviceId++),
        role,
        label: p.label || role,
        connectedAt: Date.now()
      })
      send(socket, 'identified', { deviceId: devices.get(socket).id })
      pushDevices()
    } else if (KITCHEN_ONLY.includes(data.type) && !isKitchen(socket)) {
      return
    } else if (data.type === 'get_menu') {
      send(socket, 'menu', { menu })
    } else if (data.type === 'add_item') {
      const item = p.item || {}
      menu.items.push({
        id: item.id || `item-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        category: item.category || menu.categories[0]?.id || 'geral',
        name: item.name || 'Novo item',
        desc: item.desc || '',
        price: Number(item.price) || 0,
        emoji: item.emoji || '🍽️'
      })
      saveMenu(menu)
      pushMenu()
    } else if (data.type === 'update_item') {
      const i = menu.items.findIndex((x) => x.id === p.item?.id)
      if (i >= 0) {
        menu.items[i] = { ...menu.items[i], ...p.item }
        saveMenu(menu)
        pushMenu()
      }
    } else if (data.type === 'remove_item') {
      menu.items = menu.items.filter((x) => x.id !== p.id)
      saveMenu(menu)
      pushMenu()
    } else if (data.type === 'add_category') {
      menu.categories.push({
        id: p.id || `cat-${Date.now()}`,
        name: p.name || 'Nova categoria',
        emoji: p.emoji || '🍽️'
      })
      saveMenu(menu)
      pushMenu()
    } else if (data.type === 'remove_category') {
      menu.categories = menu.categories.filter((c) => c.id !== p.id)
      menu.items = menu.items.filter((x) => x.category !== p.id)
      saveMenu(menu)
      pushMenu()
    } else if (data.type === 'kick') {
      for (const [sock, rec] of devices) {
        if (rec.id === String(p.deviceId)) {
          send(sock, 'kicked', { reason: 'Acesso encerrado pelo balcão.' })
          sock.close(4001, 'kicked')
          break
        }
      }
    } else if (data.type === 'place_order') {
      const table = p.table || '—'
      const st = comandaStatus[table]
      if (st === 'pending') {
        send(socket, 'comanda_blocked', {
          table,
          message: 'Sua comanda já está fechada. Chame o garçom para abrir uma nova.'
        })
        return
      }
      if (st === 'paid') delete comandaStatus[table]

      const order = {
        id: String(nextId++).padStart(3, '0'),
        customerName: p.customerName || 'Cliente',
        table,
        items: p.items || [],
        notes: p.notes || '',
        total: Number(p.total) || 0,
        status: 'new',
        createdAt: Date.now()
      }
      orders.unshift(order)
      send(socket, 'placed', { order })
      broadcast('order_placed', { order }, socket)
      pushComandas()
    } else if (data.type === 'update_status') {
      const order = orders.find((o) => o.id === p.orderId)
      if (!order) return
      order.status = p.status
      if (p.status === 'delivered') {
        orders = orders.filter((o) => o.id !== order.id)
        broadcast('order_removed', { orderId: order.id })
      } else {
        broadcast('order_updated', { order })
      }
      pushComandas()
    } else if (data.type === 'close_comanda') {
      const table = p.table
      if (!table || comandaStatus[table] === 'pending') return
      comandaStatus[table] = 'pending'
      broadcast('comanda_updated', { table, status: 'pending' })
      pushComandas()
    } else if (data.type === 'confirm_payment') {
      const table = p.table
      if (!table) return
      comandaStatus[table] = 'paid'
      const tableOrders = orders.filter((o) => o.table === table)
      orders = orders.filter((o) => o.table !== table)
      for (const o of tableOrders) broadcast('order_removed', { orderId: o.id })
      delete comandaStatus[table]
      broadcast('comanda_closed', { table })
      pushComandas()
    }
  })
})

app.use(express.static(DIST_DIR))
app.get('*', (req, res, next) => {
  if (req.path.startsWith('/ws')) return next()
  res.sendFile(path.join(DIST_DIR, 'index.html'))
})

const PORT = process.env.PORT || 4000
server.listen(PORT, () => {
  console.log(`[Buteco do Alemão] servidor online em http://localhost:${PORT}`)
})
