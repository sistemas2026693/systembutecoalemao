import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const DATA_DIR = path.join(__dirname, '..', 'data')
const MENU_FILE = path.join(DATA_DIR, 'menu.json')
const SEED_FILE = path.join(__dirname, '..', 'seed', 'menu.json')

const DEFAULT_MENU = {
  categories: [
    { id: 'chopp', name: 'Chopp & Cervejas', emoji: '🍺' },
    { id: 'drinks', name: 'Destilados', emoji: '🥃' },
    { id: 'nonalc', name: 'Sem Álcool', emoji: '🥤' },
    { id: 'porcoes', name: 'Porções', emoji: '🍟' },
    { id: 'pratos', name: 'Pratos', emoji: '🥘' },
    { id: 'sobremesas', name: 'Sobremesas', emoji: '🍰' }
  ],
  items: [
    { id: 'chopp-1', category: 'chopp', name: 'Chopp Pilsen 300ml', desc: 'Gelado, colarinho perfeito e cremoso.', price: 8.9, emoji: '🍺' },
    { id: 'chopp-2', category: 'chopp', name: 'Chopp Pilsen 500ml', desc: 'O queridinho da casa, sempre no ponto.', price: 12.9, emoji: '🍻' },
    { id: 'chopp-3', category: 'chopp', name: 'Chopp Weiss 500ml', desc: 'Chopp de trigo estilo alemão, cítrico.', price: 16.9, emoji: '🍺' },
    { id: 'chopp-4', category: 'chopp', name: 'Heineken Long Neck', desc: 'Long neck geladíssima para brindar.', price: 9.9, emoji: '🍾' },
    { id: 'chopp-5', category: 'chopp', name: 'Original 600ml', desc: 'A clássica para acompanhar as porções.', price: 14.9, emoji: '🍻' },
    { id: 'chopp-6', category: 'chopp', name: 'Corona Long Neck', desc: 'Com limão, refrescância garantida.', price: 10.9, emoji: '🍾' },

    { id: 'drinks-1', category: 'drinks', name: 'Caipirinha de Limão', desc: 'Cachaça artesanal, limão e muito gelo.', price: 15.9, emoji: '🍋' },
    { id: 'drinks-2', category: 'drinks', name: 'Caipirinha de Morango', desc: 'Doce, ácida e refrescante.', price: 18.9, emoji: '🍓' },
    { id: 'drinks-3', category: 'drinks', name: 'Gin Tônica Premium', desc: 'Gin, tônica, zimbro e rodela de limão.', price: 24.9, emoji: '🥂' },
    { id: 'drinks-4', category: 'drinks', name: 'Cachaça Artesanal (dose)', desc: 'Envelhecida em carvalho, pura ou com mel.', price: 8.0, emoji: '🥃' },
    { id: 'drinks-5', category: 'drinks', name: 'Aperol Spritz', desc: 'Prosecco, Aperol e soda, o clássico italiano.', price: 22.9, emoji: '🍹' },
    { id: 'drinks-6', category: 'drinks', name: 'Moscow Mule', desc: 'Vodka, gengibre e limão no copo de cobre.', price: 21.9, emoji: '🥤' },

    { id: 'nonalc-1', category: 'nonalc', name: 'Coca-Cola Lata', desc: 'Geladíssima.', price: 6.9, emoji: '🥤' },
    { id: 'nonalc-2', category: 'nonalc', name: 'Guaraná Antarctica', desc: 'Geladíssimo.', price: 5.9, emoji: '🥤' },
    { id: 'nonalc-3', category: 'nonalc', name: 'Suco de Laranja Natural', desc: 'Feito na hora.', price: 10.9, emoji: '🍊' },
    { id: 'nonalc-4', category: 'nonalc', name: 'Limonada Suíça', desc: 'Com leite condensado e gelo picado.', price: 12.9, emoji: '🍋' },
    { id: 'nonalc-5', category: 'nonalc', name: 'Água Mineral 500ml', desc: 'Com ou sem gás.', price: 4.5, emoji: '💧' },

    { id: 'porcoes-1', category: 'porcoes', name: 'Batata Frita com Cheddar e Bacon', desc: 'Crocante, com cheddar cremoso e bacon.', price: 32.9, emoji: '🍟' },
    { id: 'porcoes-2', category: 'porcoes', name: 'Torresmo de Rolo', desc: 'Crocr cru, o orgulho do buteco.', price: 28.9, emoji: '🥓' },
    { id: 'porcoes-3', category: 'porcoes', name: 'Mandioca Frita', desc: 'Dourada por fora, macia por dentro.', price: 26.9, emoji: '🍠' },
    { id: 'porcoes-4', category: 'porcoes', name: 'Calabresa Acebolada', desc: 'Fatias grelhadas com bastante cebola.', price: 29.9, emoji: '🌭' },
    { id: 'porcoes-5', category: 'porcoes', name: 'Frango a Passarinho', desc: 'Com alho frito e limão.', price: 31.9, emoji: '🍗' },
    { id: 'porcoes-6', category: 'porcoes', name: 'Bolinho de Bacalhau (8 un)', desc: 'Recheado e sequinho.', price: 34.9, emoji: '🐟' },
    { id: 'porcoes-7', category: 'porcoes', name: 'Onion Rings (Borda Alemã)', desc: 'Anéis crocantes com molho da casa.', price: 27.9, emoji: '🧅' },

    { id: 'pratos-1', category: 'pratos', name: 'Salsichão Alemão Defumado', desc: 'Grelhado com molho de mostarda e batata.', price: 39.9, emoji: '🌭' },
    { id: 'pratos-2', category: 'pratos', name: 'Eisbein (Joelho de Porco)', desc: 'Assado na brasa com chucrute e purê.', price: 54.9, emoji: '🍖' },
    { id: 'pratos-3', category: 'pratos', name: 'Chucrute com Linguiça', desc: 'Especialidade alemã da casa.', price: 42.9, emoji: '🥗' },
    { id: 'pratos-4', category: 'pratos', name: 'Strogonoff de Filé', desc: 'Com arroz, fritas e batata palha.', price: 38.9, emoji: '🥘' },
    { id: 'pratos-5', category: 'pratos', name: 'Hambúrguer Artesanal 200g', desc: 'Pão brioche, queijo, bacon e fritas.', price: 34.9, emoji: '🍔' },
    { id: 'pratos-6', category: 'pratos', name: 'Feijoada Completa', desc: 'Servida às quartas e sábados.', price: 36.9, emoji: '🍲' },

    { id: 'sobremesas-1', category: 'sobremesas', name: 'Pudim de Leite Condensado', desc: 'Receita da vó, com calda de caramelo.', price: 12.9, emoji: '🍮' },
    { id: 'sobremesas-2', category: 'sobremesas', name: 'Brownie com Sorvete', desc: 'Quentinho com sorvete de creme.', price: 18.9, emoji: '🍫' },
    { id: 'sobremesas-3', category: 'sobremesas', name: 'Torta Alemã', desc: 'Cremosa com bolacha e chocolate.', price: 15.9, emoji: '🍰' }
  ]
}

export function loadMenu() {
  try {
    if (fs.existsSync(MENU_FILE)) {
      const parsed = JSON.parse(fs.readFileSync(MENU_FILE, 'utf8'))
      if (parsed && Array.isArray(parsed.categories) && Array.isArray(parsed.items)) {
        return parsed
      }
    }
    if (fs.existsSync(SEED_FILE)) {
      const parsed = JSON.parse(fs.readFileSync(SEED_FILE, 'utf8'))
      if (parsed && Array.isArray(parsed.categories) && Array.isArray(parsed.items)) {
        saveMenu(parsed)
        return parsed
      }
    }
  } catch (err) {
    console.error('[menu] falha ao ler menu.json, usando padrão:', err.message)
  }
  const seed = JSON.parse(JSON.stringify(DEFAULT_MENU))
  saveMenu(seed)
  return seed
}

export function saveMenu(menu) {
  try {
    fs.mkdirSync(DATA_DIR, { recursive: true })
    fs.writeFileSync(MENU_FILE, JSON.stringify(menu, null, 2))
  } catch (err) {
    console.error('[menu] falha ao salvar menu.json:', err.message)
  }
}
