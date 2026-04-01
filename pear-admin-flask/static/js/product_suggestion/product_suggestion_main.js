layui.use(['table', 'form', 'jquery'], function () {
    let table = layui.table
    let form = layui.form
    let $ = layui.jquery

    // 初始化表格
    table.render({
        elem: '#suggestionTable',
        url: TABLE_URL,
        toolbar: '#toolbar',
        defaultToolbar: ['filter', 'print', 'exports'],
        page: true,
        cols: [[
            { type: 'checkbox' },
            { field: 'id', title: 'ID', width: 80, sort: true },
            { field: 'title', title: '建议标题', minWidth: 200 },
            { field: 'priority', title: '优先级', width: 100, templet: '#priorityTpl' },
            { field: 'status', title: '状态', width: 120, templet: '#statusTpl' },
            { field: 'creator_name', title: '创建者', width: 120 },
            { field: 'product_type_level1', title: '产品类型', width: 150 },
            { field: 'create_time', title: '创建时间', width: 170, sort: true },
            { field: 'update_time', title: '更新时间', width: 170, sort: true },
            { title: '操作', width: 200, align: 'center', toolbar: '#toolbarDemo', fixed: 'right' }
        ]],
        skin: 'line',
        even: true,
        page: true,
        limit: 15,
        limits: [15, 30, 50, 100]
    })

    // 监听工具条事件
    table.on('tool(suggestionTable)', function (obj) {
        let data = obj.data
        if (obj.event === 'view') {
            viewSuggestion(data.id)
        } else if (obj.event === 'edit') {
            editSuggestion(data.id)
        } else if (obj.event === 'delete') {
            deleteSuggestion(data.id, data.title)
        }
    })

    // 监听表格工具栏事件
    table.on('toolbar(suggestionTable)', function (obj) {
        if (obj.event === 'add') {
            addSuggestion()
        } else if (obj.event === 'batchRemove') {
            batchDelete()
        }
    })

    // 新增建议
    window.addSuggestion = function () {
        layer.open({
            type: 2,
            title: '新增产品建议',
            area: ['800px', '600px'],
            content: ADD_URL,
            end: function () {
                table.reload('suggestionTable')
            }
        })
    }

    // 查看建议
    window.viewSuggestion = function (id) {
        layer.open({
            type: 2,
            title: '查看产品建议',
            area: ['800px', '600px'],
            content: VIEW_URL + '/' + id
        })
    }

    // 编辑建议
    window.editSuggestion = function (id) {
        layer.open({
            type: 2,
            title: '编辑产品建议',
            area: ['800px', '600px'],
            content: EDIT_URL + '/' + id,
            end: function () {
                table.reload('suggestionTable')
            }
        })
    }

    // 删除建议
    window.deleteSuggestion = function (id, title) {
        layer.confirm('确定要删除产品建议【' + title + '】吗？', {
            btn: ['确定', '取消']
        }, function () {
            $.ajax({
                url: DELETE_URL,
                type: 'POST',
                data: { id: id },
                success: function (res) {
                    if (res.success) {
                        layer.msg(res.msg, { icon: 1, time: 1500 }, function () {
                            table.reload('suggestionTable')
                        })
                    } else {
                        layer.msg(res.msg, { icon: 2 })
                    }
                },
                error: function () {
                    layer.msg('删除失败', { icon: 2 })
                }
            })
        })
    }

    // 批量删除
    window.batchDelete = function () {
        let checkStatus = table.checkStatus('suggestionTable')
        let data = checkStatus.data

        if (data.length === 0) {
            layer.msg('请选择要删除的数据', { icon: 2 })
            return
        }

        layer.confirm('确定要删除选中的 ' + data.length + ' 条数据吗？', {
            btn: ['确定', '取消']
        }, function () {
            let ids = data.map(function (item) {
                return item.id
            })

            $.ajax({
                url: BATCH_DELETE_URL,
                type: 'POST',
                data: { 'ids[]': ids },
                success: function (res) {
                    if (res.success) {
                        layer.msg(res.msg, { icon: 1, time: 1500 }, function () {
                            table.reload('suggestionTable')
                        })
                    } else {
                        layer.msg(res.msg, { icon: 2 })
                    }
                },
                error: function () {
                    layer.msg('批量删除失败', { icon: 2 })
                }
            })
        })
    }

    // 重置搜索
    window.resetSearch = function () {
        $('#searchTitle').val('')
        $('#searchPriority').val('')
        $('#searchStatus').val('')
        $('#product_type_level1').val('')
        $('#searchCreator').val('')
        form.render('select')
        table.reload('suggestionTable', {
            where: {
                searchTitle: '',
                searchPriority: '',
                searchStatus: '',
                product_type_level1: '',
                searchCreator: ''
            },
            page: {
                curr: 1
            }
        })
    }

    // 搜索表格
    window.search_table = function () {
        let searchTitle = $('#searchTitle').val()
        let priority = $('#searchPriority').val()
        let status = $('#searchStatus').val()
        let product_type_level1 = $('#product_type_level1').val()
        let searchCreator = $('#searchCreator').val()

        table.reload('suggestionTable', {
            where: {
                searchTitle: searchTitle,
                searchPriority: priority,
                searchStatus: status,
                product_type_level1: product_type_level1,
                searchCreator: searchCreator
            },
            page: {
                curr: 1
            }
        })
    }
})
