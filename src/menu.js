const nativeRequire = eval('require')

const {shell, clipboard, remote} = require('electron')
const isRenderer = remote != null
const {app} = isRenderer ? remote : require('electron')

const i18n = require('./i18n')
const t = i18n.t
const setting = isRenderer ? remote.require('./setting') : nativeRequire('./setting')

const sabaki = isRenderer ? window.sabaki : null
const dialog = isRenderer ? require('./modules/dialog') : null
const gametree = isRenderer ? require('./modules/gametree') : null

let toggleSetting = key => setting.set(key, !setting.get(key))
let selectTool = tool => (sabaki.setMode('edit'), sabaki.setState({selectedTool: tool}))
let treePosition = () => [sabaki.state.gameTrees[sabaki.state.gameIndex], sabaki.state.treePosition]

let menu = null

exports.build = function(props = {}) {
    let {
        disableAll = false,
        disableGameNavigation = false
    } = props

    let data = [
        {
            id: 'file',
            label: t('menu.file', '文件(&F)'),
            submenu: [
                {
                    label: t('menu.file', '新建'),
                    accelerator: 'CmdOrCtrl+N',
                    enabled: !disableGameNavigation,
                    click: () => sabaki.newFile({playSound: true, showInfo: true})
                },
                {
                    label: t('menu.file', '新窗口'),
                    accelerator: 'CmdOrCtrl+Shift+N',
                    clickMain: 'newWindow',
                    neverDisable: true
                },
                {type: 'separator'},
                {
                    label: t('menu.file', '打开…'),
                    accelerator: 'CmdOrCtrl+O',
                    enabled: !disableGameNavigation,
                    click: () => sabaki.loadFile()
                },
                {
                    label: t('menu.file', '保存'),
                    accelerator: 'CmdOrCtrl+S',
                    click: () => sabaki.saveFile(sabaki.state.representedFilename)
                },
                {
                    label: t('menu.file', '另存为…'),
                    accelerator: 'CmdOrCtrl+Shift+S',
                    click: () => sabaki.saveFile()
                },
                {type: 'separator'},
                {
                    label: t('menu.file', '剪贴板'),
                    submenu: [
                        {
                            label: t('menu.file', '载入 SGF'),
                            enabled: !disableGameNavigation,
                            click: () => sabaki.loadContent(clipboard.readText(), 'sgf')
                        },
                        {
                            label: t('menu.file', '复制 SGF'),
                            click: () => clipboard.writeText(sabaki.getSGF())
                        },
                        {
                            label: t('menu.file', '复制 &ASCII 图'),
                            click: () => clipboard.writeText(sabaki.getBoardAscii())
                        }
                    ]
                },
                {type: 'separator'},
                {
                    label: t('menu.file', '对局信息'),
                    accelerator: 'CmdOrCtrl+I',
                    click: () => sabaki.openDrawer('info')
                },
                {
                    label: t('menu.file', '管理棋局…'),
                    accelerator: 'CmdOrCtrl+Shift+M',
                    enabled: !disableGameNavigation,
                    click: () => sabaki.openDrawer('gamechooser')
                },
                {type: 'separator'},
                {
                    label: t('menu.file', '偏好…'),
                    accelerator: 'CmdOrCtrl+,',
                    click: () => sabaki.openDrawer('preferences')
                }
            ]
        },
        {
            id: 'play',
            label: t('menu.play', '棋局中(&P)'),
            submenu: [
                {
                    label: t('menu.play', '切换对局者'),
                    click: () => sabaki.setPlayer(...treePosition(), -sabaki.getPlayer(...treePosition()))
                },
                {type: 'separator'},
                {
                    label: t('menu.play', '选择点'),
                    accelerator: 'CmdOrCtrl+L',
                    click: () => dialog.showInputBox('输入坐标以选择点', ({value}) => {
                        sabaki.clickVertex(value)
                    })
                },
                {
                    label: t('menu.play', '通过一手'),
                    accelerator: 'CmdOrCtrl+P',
                    click: () => {
                        const autoGenmove = setting.get('gtp.auto_genmove')
                        sabaki.makeMove([-1, -1], {sendToEngine: autoGenmove})
                    }
                },
                {
                    label: t('menu.play', '认输'),
                    click: () => sabaki.makeResign()
                },
                {type: 'separator'},
                {
                    label: t('menu.play', '估算－形势判断'),
                    click: () => sabaki.setMode('estimator')
                },
                {
                    label: t('menu.play', '比分－点目'),
                    click: () => sabaki.setMode('scoring')
                }
            ]
        },
        {
            id: 'edit',
            label: t('menu.edit', '编辑(&E)'),
            submenu: [
                {
                    label: t('menu.edit', '撤消'),
                    accelerator: 'CmdOrCtrl+Z',
                    click: () => sabaki.undo()
                },
                {
                    label: t('menu.edit', '重做'),
                    accelerator: process.platform === 'win32' ? 'CmdOrCtrl+Y' : 'CmdOrCtrl+Shift+Z',
                    click: () => sabaki.redo()
                },
                {type: 'separator'},
                {
                    label: t('menu.edit', '切换编辑模式'),
                    accelerator: 'CmdOrCtrl+E',
                    click: () => sabaki.setMode(sabaki.state.mode === 'edit' ? 'play' : 'edit')
                },
                {
                    label: t('menu.edit', '选择工具'),
                    submenu: [
                        {
                            label: t('menu.edit', '棋子工具'),
                            accelerator: 'CmdOrCtrl+1',
                            click: () => selectTool(
                                sabaki.state.mode !== 'edit' || sabaki.state.selectedTool !== 'stone_1'
                                ? 'stone_1' : 'stone_-1'
                            )
                        },
                        {
                            label: t('menu.edit', '交叉工具'),
                            accelerator: 'CmdOrCtrl+2',
                            click: () => selectTool('cross')
                        },
                        {
                            label: t('menu.edit', '三角工具'),
                            accelerator: 'CmdOrCtrl+3',
                            click: () => selectTool('triangle')
                        },
                        {
                            label: t('menu.edit', '矩形工具'),
                            accelerator: 'CmdOrCtrl+4',
                            click: () => selectTool('square')
                        },
                        {
                            label: t('menu.edit', '圆形工具'),
                            accelerator: 'CmdOrCtrl+5',
                            click: () => selectTool('circle')
                        },
                        {
                            label: t('menu.edit', '线条工具'),
                            accelerator: 'CmdOrCtrl+6',
                            click: () => selectTool('line')
                        },
                        {
                            label: t('menu.edit', '箭头工具'),
                            accelerator: 'CmdOrCtrl+7',
                            click: () => selectTool('arrow')
                        },
                        {
                            label: t('menu.edit', '标签工具'),
                            accelerator: 'CmdOrCtrl+8',
                            click: () => selectTool('label')
                        },
                        {
                            label: t('menu.edit', '数字工具'),
                            accelerator: 'CmdOrCtrl+9',
                            click: () => selectTool('number')
                        }
                    ]
                },
                {type: 'separator'},
                {
                    label: t('menu.edit', '复制变化'),
                    click: () => sabaki.copyVariation(...treePosition())
                },
                {
                    label: t('menu.edit', '剪切变化'),
                    click: () => sabaki.cutVariation(...treePosition())
                },
                {
                    label: t('menu.edit', '粘贴变化'),
                    click: () => sabaki.pasteVariation(...treePosition())
                },
                {type: 'separator'},
                {
                    label: t('menu.edit', '升为主变化'),
                    click: () => sabaki.makeMainVariation(...treePosition())
                },
                {
                    label: t('menu.edit', '左移'),
                    click: () => sabaki.shiftVariation(...treePosition(), -1)
                },
                {
                    label: t('menu.edit', '右移'),
                    click: () => sabaki.shiftVariation(...treePosition(), 1)
                },
                {type: 'separator'},
                {
                    label: t('menu.edit', '变平－为根节点'),
                    click: () => sabaki.flattenVariation(...treePosition())
                },
                {
                    label: t('menu.edit', '删除节点'),
                    accelerator: process.platform === 'darwin' ? 'CmdOrCtrl+Backspace' : 'CmdOrCtrl+Delete',
                    click: () => sabaki.removeNode(...treePosition())
                },
                {
                    label: t('menu.edit', '删除其它变化'),
                    click: () => sabaki.removeOtherVariations(...treePosition())
                }
            ]
        },
        {
            id: 'find',
            label: t('menu.find', '查找(&d)'),
            submenu: [
                {
                    label: t('menu.find', '切换查找模式'),
                    accelerator: 'CmdOrCtrl+F',
                    click: () => sabaki.setMode(sabaki.state.mode === 'find' ? 'play' : 'find'),
                },
                {
                    label: t('menu.find', '查找下一个'),
                    accelerator: 'F3',
                    click: () => {
                        sabaki.setMode('find')
                        sabaki.findMove(1, {
                            vertex: sabaki.state.findVertex,
                            text: sabaki.state.findText
                        })
                    }
                },
                {
                    label: t('menu.find', '查找上一个'),
                    accelerator: 'Shift+F3',
                    click: () => {
                        sabaki.setMode('find')
                        sabaki.findMove(-1, {
                            vertex: sabaki.state.findVertex,
                            text: sabaki.state.findText
                        })
                    }
                },
                {type: 'separator'},
                {
                    label: t('menu.find', '切换热点'),
                    accelerator: 'CmdOrCtrl+B',
                    click: () => sabaki.setComment(...treePosition(), {
                        hotspot: treePosition()[0].get(treePosition()[1]).data.HO == null
                    })
                },
                {
                    label: t('menu.find', '跳到下一个热点'),
                    accelerator: 'F2',
                    click: () => sabaki.findHotspot(1),
                },
                {
                    label: t('menu.find', '跳到上一个热点'),
                    accelerator: 'Shift+F2',
                    click: () => sabaki.findHotspot(-1),
                }
            ]
        },
        {
            id: 'navigation',
            label: t('menu.navigation', '导航(&N)'),
            submenu: [
                {
                    label: t('menu.navigation', '后退'),
                    accelerator: 'Up',
                    click: () => sabaki.goStep(-1)
                },
                {
                    label: t('menu.navigation', '前进'),
                    accelerator: 'Down',
                    click: () => sabaki.goStep(1)
                },
                {type: 'separator'},
                {
                    label: t('menu.navigation', '上一个分支'),
                    accelerator: 'CmdOrCtrl+Up',
                    click: () => sabaki.goToPreviousFork()
                },
                {
                    label: t('menu.navigation', '下一个分支'),
                    accelerator: 'CmdOrCtrl+Down',
                    click: () => sabaki.goToNextFork()
                },
                {type: 'separator'},
                {
                    label: t('menu.navigation', '上一注释'),
                    accelerator: 'CmdOrCtrl+Shift+Up',
                    click: () => sabaki.goToComment(-1)
                },
                {
                    label: t('menu.navigation', '下一注释'),
                    accelerator: 'CmdOrCtrl+Shift+Down',
                    click: () => sabaki.goToComment(1)
                },
                {type: 'separator'},
                {
                    label: t('menu.navigation', '转到开始'),
                    accelerator: 'Home',
                    click: () => sabaki.goToBeginning()
                },
                {
                    label: t('menu.navigation', '转到结束'),
                    accelerator: 'End',
                    click: () => sabaki.goToEnd()
                },
                {type: 'separator'},
                {
                    label: t('menu.navigation', '转到主变化'),
                    accelerator: 'CmdOrCtrl+Left',
                    click: () => sabaki.goToMainVariation()
                },
                {
                    label: t('menu.navigation', '转到上一变化'),
                    accelerator: 'Left',
                    click: () => sabaki.goToSiblingVariation(-1)
                },
                {
                    label: t('menu.navigation', '转到下一变化'),
                    accelerator: 'Right',
                    click: () => sabaki.goToSiblingVariation(1)
                },
                {type: 'separator'},
                {
                    label: t('menu.navigation', '转到手数编号'),
                    accelerator: 'CmdOrCtrl+G',
                    click: () => dialog.showInputBox('输入转到手数编号', ({value}) => {
                        sabaki.closeDrawer()
                        sabaki.goToMoveNumber(value)
                    })
                },
                {type: 'separator'},
                {
                    label: t('menu.navigation', '转到下一对局'),
                    accelerator: 'CmdOrCtrl+PageDown',
                    click: () => sabaki.goToSiblingGame(1)
                },
                {
                    label: t('menu.navigation', '转到上一对局'),
                    accelerator: 'CmdOrCtrl+PageUp',
                    click: () => sabaki.goToSiblingGame(-1)
                }
            ]
        },
        {
            id: 'engines',
            label: t('menu.engines', '引擎(&i)'),
            submenu: [
                {
                    label: t('menu.engines', '管理引擎…'),
                    click: () => (sabaki.setState({preferencesTab: 'engines'}), sabaki.openDrawer('preferences'))
                },
                {type: 'separator'},
                {
                    label: t('menu.engines', '连接－引擎…'),
                    click: () => sabaki.openDrawer('info')
                },
                {
                    label: t('menu.engines', '分离－引擎'),
                    click: () => sabaki.detachEngines()
                },
                {
                    label: t('menu.engines', '暂停－引擎'),
                    enabled: true,
                    click: () => sabaki.suspendEngines()
                },
                {type: 'separator'},
                {
                    label: t('menu.engines', '同步'),
                    accelerator: 'F6',
                    click: () => sabaki.syncEngines()
                },
                {
                    label: t('menu.engines', '切换分析'),
                    accelerator: 'F4',
                    click: () => {
                        if (sabaki.state.analysisTreePosition == null) {
                            sabaki.closeDrawer()
                            sabaki.setMode('play')
                            sabaki.startAnalysis()
                        } else {
                            sabaki.stopAnalysis()
                        }
                    }
                },
                {
                    label: t('menu.engines', '开始对局'),
                    accelerator: 'F5',
                    click: () => sabaki.generateMove({analyze: sabaki.state.analysis != null, followUp: true})
                },
                {
                    label: t('menu.engines', '生成新点'),
                    accelerator: 'F10',
                    click: () => sabaki.generateMove({analyze: sabaki.state.analysis != null})
                },
                {type: 'separator'},
                {
                    label: t('menu.engines', '切换 GTP 控制台'),
                    click: () => {
                        toggleSetting('view.show_leftsidebar')
                        sabaki.setState(({showConsole}) => ({showConsole: !showConsole}))
                    }
                },
                {
                    label: t('menu.engines', '清除控制台'),
                    click: () => sabaki.clearConsole()
                }
            ]
        },
        {
            id: 'tools',
            label: t('menu.tools', '工具(&T)'),
            submenu: [
                {
                    label: t('menu.tools', '切换自动打谱模式'),
                    click: () => sabaki.setMode(sabaki.state.mode === 'autoplay' ? 'play' : 'autoplay')
                },
                {
                    label: t('menu.tools', '切换猜局模式'),
                    click: () => sabaki.setMode(sabaki.state.mode === 'guess' ? 'play' : 'guess')
                },
                {type: 'separator'},
                {
                    label: t('menu.tools', '清除标记…'),
                    click: () => sabaki.openDrawer('cleanmarkup')
                },
                {
                    label: t('menu.tools', '编辑 SGF 属性…'),
                    click: () => sabaki.openDrawer('advancedproperties')
                },
                {type: 'separator'},
               {
                    label: t('menu.tools', '顺时针旋转－棋盘'),
                    enabled: !disableGameNavigation,
                    click: () => sabaki.rotateBoard(false)
               },
               {
                    label: t('menu.tools', '逆时针旋转－棋盘'),
                    enabled: !disableGameNavigation,
                    click: () => sabaki.rotateBoard(true)
               },
               {
                    label: t('menu.tools', '水平翻转－棋盘'),
                    enabled: !disableGameNavigation,
                    click: () => sabaki.flipBoard(true)
               },
               {
                    label: t('menu.tools', '垂直翻转－棋盘'),
                    enabled: !disableGameNavigation,
                    click: () => sabaki.flipBoard(false)
               },
               {
                    label: t('menu.tools', '反转颜色－棋子'),
                    enabled: !disableGameNavigation,
                    click: () => sabaki.invertColors()
                }
            ]
        },
        {
            id: 'view',
            label: t('menu.view', '显示(&V)'),
            submenu: [
                {
                    label: t('menu.view', '切换菜单栏'),
                    click: () => toggleSetting('view.show_menubar')
                },
                {
                    label: t('menu.view', '切换全屏'),
                    accelerator: process.platform === 'darwin' ? 'CmdOrCtrl+Shift+F' : 'F11',
                    click: () => sabaki.setState(({fullScreen}) => ({fullScreen: !fullScreen}))
                },
                {type: 'separator'},
                {
                    label: t('menu.view', '显示坐标'),
                    accelerator: 'CmdOrCtrl+Shift+C',
                    type: 'checkbox',
                    checked: setting.get('view.show_coordinates'),
                    click: () => toggleSetting('view.show_coordinates')
                },
                {
                    label: t('menu.view', '显示手数编号'),
                    type: 'checkbox',
                    checked: setting.get('view.show_move_numbers'),
                    click: () => toggleSetting('view.show_move_numbers')
                },
                {
                    label: t('menu.view', '显示移动彩色化'),
                    type: 'checkbox',
                    checked: setting.get('view.show_move_colorization'),
                    click: () => toggleSetting('view.show_move_colorization')
                },
                {
                    label: t('menu.view', '显示下一步'),
                    type: 'checkbox',
                    checked: setting.get('view.show_next_moves'),
                    click: () => toggleSetting('view.show_next_moves')
                },
                {
                    label: t('menu.view', '显示同级变化'),
                    type: 'checkbox',
                    checked: setting.get('view.show_siblings'),
                    click: () => toggleSetting('view.show_siblings')
                },
                {type: 'separator'},
                {
                    label: t('menu.view', '显示棋局树'),
                    type: 'checkbox',
                    checked: setting.get('view.show_graph'),
                    accelerator: 'CmdOrCtrl+T',
                    click: () => {
                        toggleSetting('view.show_graph')
                        sabaki.setState(({showGameGraph}) => ({showGameGraph: !showGameGraph}))
                    }
                },
                {
                    label: t('menu.view', '显示注释'),
                    type: 'checkbox',
                    checked: setting.get('view.show_comments'),
                    accelerator: 'CmdOrCtrl+Shift+T',
                    click: () => {
                        toggleSetting('view.show_comments')
                        sabaki.setState(({showCommentBox}) => ({showCommentBox: !showCommentBox}))
                    }
                },
                {type: 'separator'},
                {
                    label: t('menu.view', '缩放'),
                    submenu: [
                        {
                            label: t('menu.view', '升高'),
                            accelerator: 'CmdOrCtrl+Plus',
                            click: () => setting.set('app.zoom_factor',
                                setting.get('app.zoom_factor') + .1
                            )
                        },
                        {
                            label: t('menu.view', '降低'),
                            accelerator: 'CmdOrCtrl+-',
                            click: () => setting.set('app.zoom_factor',
                                Math.max(0, setting.get('app.zoom_factor') - .1)
                            )
                        },
                        {
                            label: t('menu.view', '重置'),
                            accelerator: 'CmdOrCtrl+0',
                            click: () => setting.set('app.zoom_factor', 1)
                        }
                    ]
                }
            ]
        },
        process.platform === 'darwin' && {
            submenu: [
                {
                    label: t('menu.file', 'New &Window'),
                    clickMain: 'newWindow',
                    neverDisable: true
                },
                {role: 'minimize'},
                {type: 'separator'},
                {role: 'front'}
            ],
            role: 'window'
        },
        {
            id: 'help',
            label: t('menu.help', '帮助(&H)'),
            submenu: [
                {
                    label: t('menu.help', p => `${p.appName} v${p.version}`, {
                        appName: app.getName(),
                        version: app.getVersion()
                    }),
                    enabled: false
                },
                {
                    label: `中文版编译：独角飞马`,
                    enabled: false
                },
                {
                    label: t('menu.help', '检查更新'),
                    clickMain: 'checkForUpdates',
                    enabled: true
                },
                {type: 'separator'},
                {
                    label: t('menu.help', 'GitHub 存储库'),
                    click: () => shell.openExternal(`https://github.com/SabakiHQ/${sabaki.appName}`)
                },
                {
                    label: t('menu.help', '报告问题'),
                    click: () => shell.openExternal(`https://github.com/SabakiHQ/${sabaki.appName}/issues`)
                }
            ]
        },
        setting.get('debug.dev_tools') && {
            id: 'developer',
            label: t('menu.developer', '开发人员(&O)'),
            submenu: [
                {
                    label: t('menu.developer', '打开设置文件夹'),
                    click: () => shell.showItemInFolder(setting.settingsPath)
                },
                {
                    label: t('menu.developer', '切换开发人员工具'),
                    click: () => remote.getCurrentWindow().webContents.toggleDevTools()
                },
                {type: 'separator'},
                {
                    label: t('menu.developer', '加载语言文件…'),
                    click: () => {
                        dialog.showOpenDialog({
                            properties: ['openFile'],
                            filters: [
                                {
                                    name: t('menu.developer', 'JavaScript Files'),
                                    extensions: ['js']
                                }
                            ]
                        }, ({result}) => {
                            if (!result || result.length === 0) return

                            i18n.loadFile(result[0])
                        })
                    }
                },
                {
                    label: t('menu.developer', '卸载语言文件'),
                    click: () => {
                        i18n.loadStrings({})
                    }
                },
                {
                    label: t('menu.developer', '保存语言文件…'),
                    click: () => {
                        dialog.showSaveDialog({
                            filters: [
                                {
                                    name: t('menu.developer', 'JavaScript Files'),
                                    extensions: ['js']
                                }
                            ]
                        }, ({result}) => {
                            if (!result) return

                            let summary = i18n.serialize(result)

                            dialog.showMessageBox(t('menu.developer', p => [
                                `Translated strings: ${p.translatedCount}`,
                                `Untranslated strings: ${p.untranslatedCount}`,
                                `Completion: ${p.complete}%`
                            ].join('\n'), {
                                translatedCount: summary.translatedCount,
                                untranslatedCount: summary.untranslatedCount,
                                complete: Math.round(summary.complete * 100)
                            }))
                        })
                    }
                }
            ]
        }
    ].filter(x => !!x)

    let findMenuItem = str => data.find(item => item.id === str)

    // Modify menu for macOS

    if (process.platform === 'darwin') {
        // Add 'App' menu

        let appMenu = [{role: 'about'}]
        let helpMenu = findMenuItem('help')
        let items = helpMenu.submenu.splice(0, 3)

        appMenu.push(...items.slice(0, 2))

        // Remove original 'Preferences' menu item

        let fileMenu = findMenuItem('file')
        let preferenceItem = fileMenu.submenu.splice(fileMenu.submenu.length - 2, 2)[1]

        appMenu.push(
            {type: 'separator'},
            preferenceItem,
            {type: 'separator'},
            {submenu: [], role: 'services'},
            {
                label: t('menu.macos', 'Text'),
                submenu: [
                    {role: 'cut'},
                    {role: 'copy'},
                    {role: 'paste'},
                    {role: 'selectall'}
                ]
            },
            {type: 'separator'},
            {role: 'hide'},
            {role: 'hideothers'},
            {type: 'separator'},
            {role: 'quit'}
        )

        data.unshift({
            label: app.getName(),
            submenu: appMenu
        })

        // Remove 'Toggle Menu Bar' menu item

        let viewMenu = findMenuItem('view')
        viewMenu.submenu.splice(0, 1)
    }

    let processMenu = (menu, idPrefix = '') => {
        menu.forEach((item, i) => {
            // Generate id

            if (item.id == null) {
                item.id = idPrefix + i
            }

            // Handle disableAll prop

            if (disableAll && !item.neverDisable && !('submenu' in item || 'role' in item)) {
                item.enabled = false
            }

            if ('submenu' in item) {
                processMenu(item.submenu, `${item.id}-`)
            }
        })

        return menu
    }

    menu = processMenu(data)
    return menu
}

exports.get = function(props) {
    return exports.build(props)
}
