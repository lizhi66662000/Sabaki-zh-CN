const fs = require('fs')
const {shell, remote} = require('electron')
const {h, Component} = require('preact')
const classNames = require('classnames')

const Drawer = require('./Drawer')

const t = require('../../i18n').context('PreferencesDrawer')
const dialog = require('../../modules/dialog')
const helper = require('../../modules/helper')
const setting = remote.require('./setting')
const gtplogger = require('../../modules/gtplogger')

class PreferencesItem extends Component {
    constructor(props) {
        super(props)

        this.state = {
            checked: setting.get(props.id)
        }

        this.handleChange = evt => {
            let {onChange = helper.noop} = this.props
            let {checked} = evt.currentTarget

            setting.set(this.props.id, checked)
            onChange(Object.assign({checked}, this.props))
        }

        setting.events.on('change', ({key, value}) => {
            if (key === this.props.id) {
                this.setState({checked: value})
            }
        })
    }

    shouldComponentUpdate(_, {checked}) {
        return checked !== this.state.checked
    }

    render({text}, {checked}) {
        return h('li', {class: 'preferences-item'},
            h('label', {},
                h('input', {
                    type: 'checkbox',
                    checked,
                    onChange: this.handleChange
                }), ' ',

                text
            )
        )
    }
}

class GeneralTab extends Component {
    constructor() {
        super()

        this.handleSoundEnabledChange = evt => {
            sabaki.window.webContents.setAudioMuted(!evt.checked)
        }

        this.handleTreeStyleChange = evt => {
            let data = {compact: [16, 4], spacious: [22, 4], big: [26, 6]}
            let [graphGridSize, graphNodeSize] = data[evt.currentTarget.value]

            setting.set('graph.grid_size', graphGridSize)
            setting.set('graph.node_size', graphNodeSize)
        }
    }

    render({graphGridSize}) {
        return h('div', {class: 'general'},
            h('ul', {},
                h(PreferencesItem, {
                    id: 'app.enable_hardware_acceleration',
                    text: t('如果可能启用硬件加速')
                }),
                h(PreferencesItem, {
                    id: 'app.startup_check_updates',
                    text: t('启动时检查更新')
                }),
                h(PreferencesItem, {
                    id: 'sound.enable',
                    text: t('启用声音'),
                    onChange: this.handleSoundEnabledChange
                }),
                h(PreferencesItem, {
                    id: 'game.goto_end_after_loading',
                    text: t('加载棋谱文件后跳到最后一步')
                }),
                h(PreferencesItem, {
                    id: 'view.fuzzy_stone_placement',
                    text: t('棋子(不对齐)模糊摆放')
                }),
                h(PreferencesItem, {
                    id: 'view.animated_stone_placement',
                    text: t('棋子动态(仿真实对局)模糊摆放')
                }),
                h(PreferencesItem, {
                    id: 'board.variation_instant_replay',
                    text: t('在棋盘上即时显示分析变化')
                }),
                h(PreferencesItem, {
                    id: 'gtp.start_game_after_attach',
                    text: t('连接引擎后立即开始对局')
                }),
                h(PreferencesItem, {
                    id: 'gtp.auto_genmove',
                    text: t('自动生成引擎走法')
                })
            ),

            h('ul', {},
                h(PreferencesItem, {
                    id: 'comments.show_move_interpretation',
                    text: t('评论标题栏自动显示行棋术语')
                }),
                h(PreferencesItem, {
                    id: 'game.show_ko_warning',
                    text: t('显示 KO 警告')
                }),
                h(PreferencesItem, {
                    id: 'game.show_suicide_warning',
                    text: t('显示自杀警告')
                }),
                h(PreferencesItem, {
                    id: 'edit.show_removenode_warning',
                    text: t('显示删除节点警告')
                }),
                h(PreferencesItem, {
                    id: 'edit.show_removeothervariations_warning',
                    text: t('显示删除其它变化警告')
                }),
                h(PreferencesItem, {
                    id: 'file.show_reload_warning',
                    text: t('如果外部更改则给予重新加载文件')
                }),
                h(PreferencesItem, {
                    id: 'edit.click_currentvertex_to_remove',
                    text: t('点击最后下的棋子删除')
                }),
                h(PreferencesItem, {
                    id: 'app.always_show_result',
                    text: t('始终显示棋局结果')
                }),
                h(PreferencesItem, {
                    id: 'view.winrategraph_invert',
                    text: t('倒置胜率图')
                }),
            ),

            h('p', {}, h('label', {},
                t('棋局树样式：'), ' ',

                h('select', {onChange: this.handleTreeStyleChange},
                    h('option', {
                        value: 'compact',
                        selected: graphGridSize < 22
                    }, t('紧凑')),

                    h('option', {
                        value: 'spacious',
                        selected: graphGridSize === 22
                    }, t('宽敞')),

                    h('option', {
                        value: 'big',
                        selected: graphGridSize > 22
                    }, t('大'))
                )
            ))
        )
    }
}

class PathInputItem extends Component {
    constructor(props) {
        super(props)

        this.state = {
            value: setting.get(props.id)
        }

        this.handlePathChange = evt => {
            let value = evt.currentTarget.value.trim() === '' ? null : evt.currentTarget.value

            setting.set(this.props.id, value)
        }

        this.handleBrowseButtonClick = evt => {
            let dialogProperties = this.props.chooseDirectory != null
                ? ['openDirectory', 'createDirectory']
                : ['openFile']

            dialog.showOpenDialog({
                properties: dialogProperties,
            }, ({result}) => {
                if (!result || result.length === 0) return

                this.handlePathChange({currentTarget: {value: result[0]}})
            })
        }

        setting.events.on('change', ({key, value}) => {
            if (key === this.props.id) {
                this.setState({value: value})
            }
        })
    }

    shouldComponentUpdate({text}, {value}) {
        return this.props.text !== text
            || this.props.value !== value
    }

    render({text}, {value}) {
        return h('li', {class: 'path-input-item'}, h('label', {},
            text != null && h('span', {}, text),

            h('input', {
                type: 'search',
                placeholder: t('路径'),
                value,
                onChange: this.handlePathChange
            }),

            h('a',
                {
                    class: 'browse',
                    onClick: this.handleBrowseButtonClick
                },
                h('img', {
                    src: './node_modules/octicons/build/svg/file-directory.svg',
                    title: t('浏览…'),
                    height: 14
                })
            ),

            value && !(
                this.props.chooseDirectory
                ? helper.isWritableDirectory(value)
                : fs.existsSync(value)
            ) && h('a', {class: 'invalid'},
                h('img', {
                    src: './node_modules/octicons/build/svg/alert.svg',
                    title: this.props.chooseDirectory
                        ? t('目录未找到')
                        : t('文件未找到'),
                    height: 14
                })
            )
        ))
    }
}

class ThemesTab extends Component {
    constructor() {
        super()

        this.state = {
            currentTheme: setting.get('theme.current')
        }

        this.handleThemeChange = evt => {
            let value = evt.currentTarget.value === '' ? null : evt.currentTarget.value

            setting.set('theme.current', value)
        }

        this.handleLinkClick = evt => {
            evt.preventDefault()

            shell.openExternal(evt.currentTarget.href)
        }

        this.handleUninstallButton = evt => {
            evt.preventDefault()

            let result = dialog.showMessageBox(
                t('你真的要卸载这个主题？'),
                'warning', [t('卸载'), t('取消')], 1
            )

            if (result === 1) return

            let rimraf = require('rimraf')
            let {path} = setting.getThemes()[this.state.currentTheme]

            rimraf(path, err => {
                if (err) return dialog.showMessageBox(t('卸载失败。'), 'error')

                setting.loadThemes()
                setting.set('theme.current', null)
            })
        }

        this.handleInstallButton = evt => {
            evt.preventDefault()

            dialog.showOpenDialog({
                properties: ['openFile'],
                filters: [{name: t('Sabaki Themes'), extensions: ['asar']}]
            }, ({result}) => {
                if (!result || result.length === 0) return

                let {join} = require('path')
                let copy = require('recursive-copy')
                let uuid = require('uuid/v1')
                let id = uuid()

                copy(result[0], join(setting.themesDirectory, id), err => {
                    if (err) return dialog.showMessageBox(t('安装失败。'), 'error')

                    setting.loadThemes()
                    setting.set('theme.current', id)
                })
            })
        }

        setting.events.on('change', ({key, value}) => {
            if (key === 'theme.current') {
                this.setState({currentTheme: value})
            }
        })
    }

    render() {
        let currentTheme = setting.getThemes()[this.state.currentTheme]

        return h('div', {class: 'themes'},
            h('h3', {}, t('自定义图像')),

            h('ul', {class: 'userpaths'},
                h(PathInputItem, {
                    id: 'theme.custom_blackstones',
                    text: t('黑子图像：')
                }),
                h(PathInputItem, {
                    id: 'theme.custom_whitestones',
                    text: t('白子图像：')
                }),
                h(PathInputItem, {
                    id: 'theme.custom_board',
                    text: t('棋盘图像：')
                }),
                h(PathInputItem, {
                    id: 'theme.custom_background',
                    text: t('背景图像：')
                })
            ),

            h('h3', {}, t('当前主题')),

            h('p', {},
                h('select',
                    {onChange: this.handleThemeChange},

                    h('option', {value: '', selected: currentTheme == null}, t('默认')),

                    Object.keys(setting.getThemes()).map(id => h('option',
                        {
                            value: id,
                            selected: currentTheme && currentTheme.id === id
                        },

                        setting.getThemes()[id].name
                    ))
                ), ' ',

                currentTheme && h('button', {
                    type: 'button',
                    onClick: this.handleUninstallButton
                }, t('卸载')),

                h('div', {class: 'install'},
                    h('button', {
                        type: 'button',
                        onClick: this.handleInstallButton
                    }, t('安装主题…')),
                    ' ',
                    h('a', {
                        href: `https://github.com/SabakiHQ/Sabaki/blob/v${sabaki.version}/docs/guides/theme-directory.md`,
                        onClick: this.handleLinkClick
                    }, t('获取更多主题…'))
                )
            ),

            currentTheme && [
                h('p', {class: 'meta'},
                    currentTheme.author && t(p => `作者：${p.author}`, {
                        author: currentTheme.author
                    }),
                    currentTheme.author && currentTheme.homepage && ' — ',
                    currentTheme.homepage && h('a', {
                        class: 'homepage',
                        href: currentTheme.homepage,
                        title: currentTheme.homepage,
                        onClick: this.handleLinkClick
                    }, t('主页'))
                ),

                h('p', {class: 'description'},
                    currentTheme.version && h('span', {class: 'version'},
                        'v' + currentTheme.version
                    ), ' ',

                    currentTheme.description
                )
            ]
        )
    }
}

class EngineItem extends Component {
    constructor() {
        super()

        this.handleChange = evt => {
            let {onChange = helper.noop} = this.props
            let element = evt.currentTarget
            let data = Object.assign({}, this.props, {
                [element.name]: element.value
            })

            onChange(data)
        }

        this.handleBrowseButtonClick = () => {
            dialog.showOpenDialog({
                properties: ['openFile'],
                filters: [{name: t('所有文件'), extensions: ['*']}]
            }, ({result}) => {
                if (!result || result.length === 0) return

                let {id, name, args, onChange = helper.noop} = this.props
                onChange({id, name, args, path: result[0]})
            })
        }

        this.handleRemoveButtonClick = () => {
            let {onRemove = helper.noop} = this.props
            onRemove(this.props)
        }
    }

    shouldComponentUpdate({name, path, args, commands}) {
        return name !== this.props.name
            || path !== this.props.path
            || args !== this.props.args
            || commands !== this.props.commands
    }

    render({name, path, args, commands}) {
        return h('li', {},
            h('h3', {},
                h('a',
                    {
                        class: 'remove',
                        title: t('删除'),
                        onClick: this.handleRemoveButtonClick
                    },

                    h('img', {src: './node_modules/octicons/build/svg/x.svg'})
                ),
                h('input', {
                    type: 'text',
                    placeholder: t('(未命名的引擎)'),
                    value: name,
                    name: 'name',
                    onChange: this.handleChange
                })
            ),
            h('p', {},
                h('a',
                    {
                        class: 'browse',
                        title: t('浏览…'),
                        onClick: this.handleBrowseButtonClick
                    },

                    h('img', {src: './node_modules/octicons/build/svg/file-directory.svg'})
                ),
                h('input', {
                    type: 'text',
                    placeholder: t('路径'),
                    value: path,
                    name: 'path',
                    onChange: this.handleChange
                })
            ),
            h('p', {},
                h('input', {
                    type: 'text',
                    placeholder: t('没有参数'),
                    value: args,
                    name: 'args',
                    onChange: this.handleChange
                })
            ),
            h('p', {},
                h('input', {
                    type: 'text',
                    placeholder: t('初始化命令(;-英文半角分号分隔)'),
                    value: commands,
                    name: 'commands',
                    onChange: this.handleChange
                })
            )
        )
    }
}

class EnginesTab extends Component {
    constructor() {
        super()

        this.handleItemChange = ({id, name, path, args, commands}) => {
            let engines = this.props.engines.slice()

            engines[id] = {name, path, args, commands}
            setting.set('engines.list', engines)
        }

        this.handleItemRemove = ({id}) => {
            let engines = this.props.engines.slice()

            engines.splice(id, 1)
            setting.set('engines.list', engines)
        }

        this.handleAddButtonClick = evt => {
            evt.preventDefault()

            let engines = this.props.engines.slice()

            engines.unshift({name: '', path: '', args: ''})
            setting.set('engines.list', engines)

            this.setState({}, () => {
                this.element.querySelector('.engines-list li:first-child input').focus()
            })
        }
    }

    render({engines}) {
        return h('div', {ref: el => this.element = el, class: 'engines'},
            h('div', {class: 'gtp-console-log'},
                h('ul', {},
                    h(PreferencesItem, {
                        id: 'gtp.console_log_enabled',
                        text: t('启用 GTP 日志记录到目录：')
                    }),

                    h(PathInputItem, {
                        id: 'gtp.console_log_path',
                        chooseDirectory: true
                    })
                )
            ),
            h('div', {class: 'engines-list'},
                h('ul', {}, engines.map(({name, path, args, commands}, id) =>
                    h(EngineItem, {
                        id,
                        name,
                        path,
                        args,
                        commands,

                        onChange: this.handleItemChange,
                        onRemove: this.handleItemRemove
                    })
                ))
            ),

            h('p', {},
                h('button', {type: 'button', onClick: this.handleAddButtonClick}, t('添加'))
            )
        )
    }
}

class PreferencesDrawer extends Component {
    constructor() {
        super()

        this.handleCloseButtonClick = evt => {
            evt.preventDefault()
            sabaki.closeDrawer()
        }

        this.handleTabClick = evt => {
            let tabs = ['general', 'themes', 'engines']
            let tab = tabs.find(x => evt.currentTarget.classList.contains(x))

            sabaki.setState({preferencesTab: tab})
        }
    }

    shouldComponentUpdate({show}) {
        return show || show !== this.props.show
    }

    componentDidUpdate(prevProps) {
        if (prevProps.show && !this.props.show) {
            // On closing

            let natsort = require('natsort')
            let cmp = natsort({insensitive: true})

            // Sort engines

            let engines = [...this.props.engines].sort((x, y) => cmp(x.name, y.name))

            setting.set('engines.list', engines)

            // Don't create an empty log file

            if (sabaki.attachedEngineSyncers.some(x => x != null)) {
                if (!gtplogger.updatePath()) {
                    // Force the user to fix the issue

                    setTimeout(() => {
                        sabaki.setState({preferencesTab: 'engines'})
                        sabaki.openDrawer('preferences')
                    }, 500)

                    return
                }
            }

            // Reset tab selection

            setTimeout(() => sabaki.setState({preferencesTab: 'general'}), 500)
        }
    }

    render({show, tab, engines, graphGridSize}) {
        return h(Drawer,
            {
                type: 'preferences',
                show
            },

            h('ul', {class: 'tabs'},
                h('li', {
                        class: classNames({general: true, current: tab === 'general'}),
                        onClick: this.handleTabClick
                    },

                    h('a', {href: '#'}, t('常 规'))
                ),
                h('li',
                    {
                        class: classNames({themes: true, current: tab === 'themes'}),
                        onClick: this.handleTabClick
                    },

                    h('a', {href: '#'}, t('主 题'))
                ),
                h('li',
                    {
                        class: classNames({engines: true, current: tab === 'engines'}),
                        onClick: this.handleTabClick
                    },

                    h('a', {href: '#'}, t('引 擎'))
                )
            ),

            h('form', {class: classNames(tab, 'tab-content')},
                h(GeneralTab, {graphGridSize}),
                h(ThemesTab),
                h(EnginesTab, {engines}),

                h('p', {},
                    h('button', {type: 'button', onClick: this.handleCloseButtonClick}, t('关闭'))
                )
            )
        )
    }
}

module.exports = PreferencesDrawer
