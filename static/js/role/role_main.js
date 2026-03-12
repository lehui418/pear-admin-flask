
layui.use(['table', 'form', 'jquery', 'popup', 'common'], function () {
    let table = layui.table
    let form = layui.form
    let $ = layui.jquery
    let popup = layui.popup

    let MODULE_PATH = '/system/role/'

    let cols = [
        [
            { title: '编号', field: 'id', align: 'center' },
            { title: '角色名', field: 'name', align: 'center', width: 100 },
            { title: '标识', field: 'code', align: 'center' },
            { title: '描述', field: 'details', align: 'center' },
            { title: '是否可用', field: 'enable', align: 'center', templet: '#role-enable' },
            { title: '排序', field: 'sort', align: 'center' },
            { title: '操作', toolbar: '#role-bar', align: 'center', width: 240 }
        ]
    ]

    table.render({
        elem: '#role-table',
        url: MODULE_PATH + 'data',
        page: true,
        cols: cols,
        skin: 'line',
        toolbar: '#role-toolbar',
        defaultToolbar: [{
            layEvent: 'refresh',
            icon: 'layui-icon-refresh',
        }, 'filter', 'print', 'exports']
    })

    table.on('tool(role-table)', function (obj) {
        if (obj.event === 'remove') {
            window.remove(obj)
        } else if (obj.event === 'edit') {
            window.edit(obj)
        } else if (obj.event === 'power') {
            window.power(obj)
        }
    })

    table.on('toolbar(role-table)', function (obj) {
        if (obj.event === 'add') {
            window.add()
        } else if (obj.event === 'refresh') {
            window.refresh()
        } else if (obj.event === 'batchRemove') {
            window.batchRemove(obj)
        }
    })

    form.on('submit(role-query)', function (data) {
        table.reload('role-table', { where: data.field })
        return false
    })

    form.on('switch(role-enable)', function (obj) {
        let operate
        if (obj.elem.checked) {
            operate = 'enable'
        } else {
            operate = 'disable'
        }
        let loading = layer.load()
        $.ajax({
            url: ROLE_MAIN_URL + operate,
            data: JSON.stringify({ roleId: this.value }),
            dataType: 'json',
            contentType: 'application/json',
            type: 'put',
            success: function (result) {
                layer.close(loading)
                if (result.success) {
                    layer.msg(result.msg, { icon: 1, time: 1000 })
                } else {
                    layer.msg(result.msg, { icon: 2, time: 1000 })
                }
            }
        })
    })

    window.add = function () {
        layer.open({
            type: 2,
            title: '新增',
            shade: 0.1,
            area: ['500px', '500px'],
            content: MODULE_PATH + 'add'
        })
    }

    window.power = function (obj) {
        layer.open({
            type: 2,
            title: '授权',
            shade: 0.1,
            area: ['320px', '400px'],
            content: MODULE_PATH + 'power/' + obj.data['id']
        })
    }

    window.edit = function (obj) {
        layer.open({
            type: 2,
            title: '修改',
            shade: 0.1,
            area: ['500px', '500px'],
            content: MODULE_PATH + 'edit/' + obj.data['id']
        })
    }

    window.remove = function (obj) {
        layer.confirm('确定要删除该角色', { icon: 3, title: '提示' }, function (index) {
            layer.close(index)
            let loading = layer.load()
            $.ajax({
                url: MODULE_PATH + 'remove/' + obj.data['id'],
                dataType: 'json',
                type: 'delete',
                success: function (result) {
                    layer.close(loading)
                    if (result.success) {
                        layer.msg(result.msg, { icon: 1, time: 1000 }, function () {
                            obj.del()
                        })
                    } else {
                        layer.msg(result.msg, { icon: 2, time: 1000 })
                    }
                }
            })
        })
    }

    window.batchRemove = function (obj) {
        let data = table.checkStatus(obj.config.id).data
        if (data.length === 0) {
            layer.msg('未选中数据', {
                icon: 3,
                time: 1000
            })
            return false
        }
        var ids = []
        var hasCheck = table.checkStatus('role-table')
        var hasCheckData = hasCheck.data
        if (hasCheckData.length > 0) {
            $.each(hasCheckData, function (index, element) {
                ids.push(element.id)
            })
        }
        console.log(ids)
        layer.confirm('确定要删除选中角色', {
            icon: 3,
            title: '提示'
        }, function (index) {
            layer.close(index)
            let loading = layer.load()
            $.ajax({

                url: MODULE_PATH + 'batchRemove',
                data: { ids: ids },
                dataType: 'json',
                type: 'delete',
                success: function (result) {
                    layer.close(loading)
                    if (result.success) {
                        popup.success(result.msg, function () {
                            table.reload('role-table')
                        })
                    } else {
                        popup.failure(result.msg)
                    }
                }
            })
        })
    }

    window.refresh = function () {
        table.reload('role-table')
    }
})
