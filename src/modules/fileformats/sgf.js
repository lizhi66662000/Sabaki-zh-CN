const GameTree = require('@sabaki/immutable-gametree')
const sgf = require('@sabaki/sgf')

const t = require('../../i18n').context('fileformats')
const {getId} = require('../helper')
const gametree = require('../gametree')

exports.meta = {
    name: t('通用棋谱格式'),
    extensions: ['sgf', 'rsgf']
}

let toGameTrees = rootNodes => rootNodes.map(root => gametree.new({getId, root}))

exports.parse = function(content, onProgress = () => {}) {
    let rootNodes = sgf.parse(content, {getId, onProgress})
    return toGameTrees(rootNodes)
}

exports.parseFile = function(filename, onProgress = () => {}) {
    let rootNodes = sgf.parseFile(filename, {getId, onProgress})
    return toGameTrees(rootNodes)
}
