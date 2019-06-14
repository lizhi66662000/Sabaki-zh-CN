const {remote} = require('electron')
const {h, Component} = require('preact')
const classNames = require('classnames')

const Drawer = require('./Drawer')

const t = require('../../i18n').context('ScoreDrawer')
const helper = require('../../modules/helper')
const setting = remote.require('./setting')

class ScoreRow extends Component {
    render({method, score, komi, handicap, sign}) {
        let index = sign > 0 ? 0 : 1

        let total = !score ? 0 : method === 'area' ? score.area[index]
            : score.territory[index] + score.captures[index]

        if (sign < 0) total += komi
        if (method === 'area' && sign < 0) total += handicap

        return h('tr', {},
            h('th', {},
                h('img', {
                    src: `./node_modules/@sabaki/shudan/css/stone_${sign}.png`,
                    alt: sign > 0 ? t('黑') : t('白'),
                    width: 24,
                    height: 24
                })
            ),
            h('td', {class: classNames({disabled: method === 'territory'})}, score ? score.area[index] : '-'),
            h('td', {class: classNames({disabled: method === 'area'})}, score ? score.territory[index] : '-'),
            h('td', {class: classNames({disabled: method === 'area'})}, score ? score.captures[index] : '-'),
            h('td', {}, sign < 0 ? komi : '-'),
            h('td', {class: classNames({disabled: method === 'territory'})}, sign < 0 ? handicap : '-'),
            h('td', {}, total)
        )
    }
}

class ScoreDrawer extends Component {
    constructor() {
        super()

        this.handleTerritoryButtonClick = () => setting.set('scoring.method', 'territory')
        this.handleAreaButtonClick = () => setting.set('scoring.method', 'area')
        this.handleCloseButtonClick = () => sabaki.closeDrawer()

        this.handleSubmitButtonClick = evt => {
            evt.preventDefault()

            let {onSubmitButtonClick = helper.noop} = this.props
            evt.resultString = this.resultString
            onSubmitButtonClick(evt)
        }
    }

    render({show, estimating, method, areaMap, board, komi, handicap}) {
        if (isNaN(komi)) komi = 0
        if (isNaN(handicap)) handicap = 0

        let score = areaMap && board && board.getScore(areaMap, {handicap, komi})
        let result = score && (method === 'area' ? score.areaScore : score.territoryScore)

        this.resultString = result > 0 ? t(p => `黑 +  ${p.result}`, {result})
            : result < 0 ? t(p => `白 + ${p.result}`, {result: -result})
            : t('和棋')

        return h(Drawer,
            {
                type: 'score',
                show
            },

            h('h2', {}, t('比分')),

            h('ul', {class: 'tabs'},
                h('li', {class: classNames({current: method === 'area'})},
                    h('a', {
                        href: '#',
                        onClick: this.handleAreaButtonClick
                    }, t('数子'))
                ),
                h('li', {class: classNames({current: method === 'territory'})},
                    h('a', {
                        href: '#',
                        onClick: this.handleTerritoryButtonClick
                    }, t('数目'))
                )
            ),

            h('table', {},
                h('thead', {}, h('tr', {},
                    h('th'),
                    h('th', {disabled: method === 'territory'}, t('子数')),
                    h('th', {disabled: method === 'area'}, t('目数')),
                    h('th', {disabled: method === 'area'}, t('提子')),
                    h('th', {}, t('贴目')),
                    h('th', {disabled: method === 'territory'}, t('让子')),
                    h('th', {}, t('总计'))
                )),
                h('tbody', {},
                    h(ScoreRow, {method, score, komi, handicap: 0, sign: 1}),
                    h(ScoreRow, {method, score, komi, handicap, sign: -1})
                )
            ),

            h('form', {},
                h('p', {},
                    t('结果：'), ' ',
                    h('span', {class: 'result'}, this.resultString), ' ',

                    !estimating && h('button', {
                        type: 'submit',
                        onClick: this.handleSubmitButtonClick
                    }, t('更新结果')), ' ',

                    h('button', {
                        type: 'reset',
                        onClick: this.handleCloseButtonClick
                    }, t('关闭'))
                )
            )
        )
    }
}

module.exports = ScoreDrawer
