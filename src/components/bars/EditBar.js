const {h, Component} = require('preact')
const classNames = require('classnames')

const Bar = require('./Bar')
const helper = require('../../modules/helper')
const t = require('../../i18n').context('EditBar')

class EditBar extends Component {
    constructor() {
        super()

        this.state = {
            stoneTool: 1
        }

        this.handleToolButtonClick = this.handleToolButtonClick.bind(this)
    }

    componentWillReceiveProps({selectedTool}) {
        if (selectedTool === this.props.selectedTool) return

        if (selectedTool.indexOf('stone') === 0) {
            this.setState({stoneTool: +selectedTool.replace('stone_', '')})
        }
    }

    shouldComponentUpdate(nextProps) {
        return nextProps.mode !== this.props.mode || nextProps.mode === 'edit'
    }

    handleToolButtonClick(evt) {
        let {selectedTool, onToolButtonClick = helper.noop} = this.props

        evt.tool = evt.currentTarget.dataset.id

        if (evt.tool.indexOf('stone') === 0 && selectedTool.indexOf('stone') === 0) {
            evt.tool = `stone_${-this.state.stoneTool}`
            this.setState(({stoneTool}) => ({stoneTool: -stoneTool}))
        }

        onToolButtonClick(evt)
    }

    renderButton(title, toolId, selected = false) {
        return h('li', {class: classNames({selected})},
            h('a',
                {
                    title,
                    href: '#',
                    'data-id': toolId,
                    onClick: this.handleToolButtonClick
                },

                h('img', {src: `./img/edit/${toolId}.svg`})
            )
        )
    }

    render({selectedTool}, {stoneTool}) {
        let isSelected = ([, id]) => id.replace(/_-?1$/, '') === selectedTool.replace(/_-?1$/, '')

        return h(Bar, Object.assign({type: 'edit'}, this.props),
            h('ul', {},
                [
                    [t('棋子工具'), `stone_${stoneTool}`],
                    [t('交叉工具'), 'cross'],
                    [t('三角工具'), 'triangle'],
                    [t('方形工具'), 'square'],
                    [t('圆形工具'), 'circle'],
                    [t('线条工具'), 'line'],
                    [t('箭头工具'), 'arrow'],
                    [t('标签工具'), 'label'],
                    [t('数字工具'), 'number']
                ].map(x =>
                    this.renderButton(...x, isSelected(x))
                )
            )
        )
    }
}

module.exports = EditBar
