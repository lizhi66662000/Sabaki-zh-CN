const {remote} = require('electron')
const {h, Component} = require('preact')

const Drawer = require('./Drawer')

const t = require('../../i18n').context('CleanMarkupDrawer')
const helper = require('../../modules/helper')
const setting = remote.require('./setting')

class CleanMarkupItem extends Component {
    constructor() {
        super()

        this.handleChange = evt => {
            setting.set(this.props.id, evt.currentTarget.checked)
        }
    }

    shouldComponentUpdate() {
        return false
    }

    render({id, text}) {
        return h('li', {},
            h('label', {},
                h('input', {
                    type: 'checkbox',
                    checked: setting.get(id),
                    onChange: this.handleChange
                }), ' ',

                text
            )
        )
    }
}

class CleanMarkupDrawer extends Component {
    constructor() {
        super()

        this.handleCloseButtonClick = evt => {
            evt.preventDefault()
            sabaki.closeDrawer()
        }

        this.handleRemoveButtonClick = evt => {
            evt.preventDefault()

            let doRemove = async work => {
                sabaki.setBusy(true)

                let data = {
                    cross: ['MA'],
                    triangle: ['TR'],
                    square: ['SQ'],
                    circle: ['CR'],
                    line: ['LN'],
                    arrow: ['AR'],
                    label: ['LB'],
                    comments: ['C', 'N'],
                    annotations: ['DM', 'GB', 'GW', 'UC', 'BM', 'DO', 'IT', 'TE'],
                    hotspots: ['HO'],
                    winrate: ['SBKV']
                }

                let properties = Object.keys(data)
                    .filter(id => setting.get(`cleanmarkup.${id}`))
                    .map(id => data[id])
                    .reduce((acc, x) => [...acc, ...x], [])

                await helper.wait(100)

                let newTree = work(properties)

                sabaki.setCurrentTreePosition(newTree, this.props.treePosition)
                sabaki.setBusy(false)
                sabaki.closeDrawer()
            }

            let template = [
                {
                    label: t('从当前位置'),
                    click: () => doRemove(properties => {
                        return this.props.gameTree.mutate(draft => {
                            for (let prop of properties) {
                                draft.removeProperty(this.props.treePosition, prop)
                            }
                        })
                    })
                },
                {
                    label: t('从整个对局'),
                    click: () => doRemove(properties => {
                        return this.props.gameTree.mutate(draft => {
                            for (let node of this.props.gameTree.listNodes()) {
                                for (let prop of properties) {
                                    draft.removeProperty(node.id, prop)
                                }
                            }
                        })
                    })
                }
            ]

            let element = evt.currentTarget
            let {left, bottom} = element.getBoundingClientRect()

            helper.popupMenu(template, left, bottom)
        }
    }

    shouldComponentUpdate({show}) {
        return show !== this.props.show
    }

    render({show}) {
        return h(Drawer,
            {
                type: 'cleanmarkup',
                show
            },

            h('h2', {}, t('清理标记')),

            h('form', {},
                h('ul', {},
                    h(CleanMarkupItem, {
                        id: 'cleanmarkup.cross',
                        text: t('交叉标记')
                    }),
                    h(CleanMarkupItem, {
                        id: 'cleanmarkup.triangle',
                        text: t('三角标记')
                    }),
                    h(CleanMarkupItem, {
                        id: 'cleanmarkup.square',
                        text: t('方形标记')
                    }),
                    h(CleanMarkupItem, {
                        id: 'cleanmarkup.circle',
                        text: t('圆形标记')
                    })
                ),
                h('ul', {},
                    h(CleanMarkupItem, {
                        id: 'cleanmarkup.line',
                        text: t('线标记')
                    }),
                    h(CleanMarkupItem, {
                        id: 'cleanmarkup.arrow',
                        text: t('箭头标记')
                    }),
                    h(CleanMarkupItem, {
                        id: 'cleanmarkup.label',
                        text: t('标签标记')
                    })
                ),
                h('ul', {},
                    h(CleanMarkupItem, {
                        id: 'cleanmarkup.comments',
                        text: t('评论')
                    }),
                    h(CleanMarkupItem, {
                        id: 'cleanmarkup.annotations',
                        text: t('注释')
                    }),
                    h(CleanMarkupItem, {
                        id: 'cleanmarkup.hotspots',
                        text: t('热点标记')
                    }),
                    h(CleanMarkupItem, {
                        id: 'cleanmarkup.winrate',
                        text: t('胜率数据')
                    })
                ),

                h('p', {},
                    h('button', {
                        type: 'button',
                        class: 'dropdown',
                        onClick: this.handleRemoveButtonClick
                    }, t('清除')), ' ',

                    h('button', {onClick: this.handleCloseButtonClick}, t('关闭'))
                )
            )
        )
    }
}

module.exports = CleanMarkupDrawer
