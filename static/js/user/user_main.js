layui.use(['table', 'dtree', 'form', 'jquery', 'popup', 'common'], function () {
    let table = layui.table
    let form = layui.form
    let $ = layui.jquery
    let dtree = layui.dtree
    let popup = layui.popup
    let common = layui.common
    let MODULE_PATH = userMainUrl
    // 表格数据
    let cols = [
        [
            { title: '编号', field: 'id', align: 'center' },
            { title: '姓名', field: 'realname', align: 'center', width: 110 },
            { title: '账号', field: 'username', align: 'center' },
            { title: '部门', field: 'dept_name', align: 'center' },
            { title: '启用', field: 'enable', align: 'center', templet: '#user-enable', width: 120 },
            { title: '注册时间', field: 'create_at', templet: '#user-createTime', align: 'center' },
            { title: '更新时间', field: 'update_at', templet: '#user-updateTime', align: 'center' },
            { title: '操作', toolbar: '#user-bar', align: 'center', width: 180 }
        ]
    ]

    // 渲染表格数据
    table.render({
        elem: '#user-table',
        url: MODULE_PATH + 'data',
        page: true,
        cols: cols,
        skin: 'line',
        toolbar: '#user-toolbar', /*工具栏*/
        text: { none: '暂无人员信息' },
        defaultToolbar: [{ layEvent: 'refresh', icon: 'layui-icon-refresh' }, 'filter', 'print', 'exports'] /*默认工具栏*/
    })

    // 公司部门树状图菜单
    dtree.render({
        elem: '#dept-tree',
        method: 'get',
        url: deptTreeUrl,
        dataFormat: 'list',
        line: true,
        skin: 'laySimple',
        icon: '-1',
        response: { treeId: 'id', parentId: 'parent_id', title: 'dept_name' },
    })

    // 菜单栏渲染
    dtree.on('node(\'dept-tree\')', function (obj) {
        let field = form.val('user-query-form') /*用户账号查询*/
        field.deptId = obj.param.nodeId
        window.refresh(field)
    })

    //
    $('.user-group').click(function () {
        let group = $(this).attr('user-group')
        let field = form.val('user-query-form')
        if (group === '-1') {
            field.deptId = group
            $(this).removeClass('button-default')
            $(this).prev().removeClass('button-primary')
            $(this).prev().addClass('button-default')
            $(this).addClass('button-primary')
        } else {
            field.deptId = group
            $(this).removeClass('button-default')
            $(this).next().removeClass('button-primary')
            $(this).next().addClass('button-default')
            $(this).addClass('button-primary')
        }
        window.refresh(field)
    })

    table.on('tool(user-table)', function (obj) {
        if (obj.event === 'remove') {
            window.remove(obj)
        } else if (obj.event === 'edit') {
            window.edit(obj)
        }
    })

    table.on('toolbar(user-table)', function (obj) {
        if (obj.event === 'add') {
            window.add()
        } else if (obj.event === 'refresh') {
            window.refresh()
        } else if (obj.event === 'batchRemove') {
            window.batchRemove(obj)
        } else if (obj.event === 'collasped') {
            $('.user-left').toggleClass('user-collasped')
            $('.user-main').toggleClass('user-collasped')
            table.resize()
        }
    })

    form.on('submit(user-query)', function (data) {
        window.refresh(data.field)
        return false
    })

    form.on('switch(user-enable)', function (obj) {
        let operate
        if (obj.elem.checked) {
            operate = 'enable'
        } else {
            operate = 'disable'
        }
        let loading = layer.load()
        $.ajax({
            url: userMainUrl + operate,
            data: JSON.stringify({ userId: this.value }),
            dataType: 'json',
            contentType: 'application/json',
            type: 'put',
            success: function (result) {
                layer.close(loading)
                if (result.success) {
                    popup.success(result.msg)
                } else {
                    popup.failure(result.msg)
                }
            }
        })
    })

    window.add = function () {
        layer.open({
            type: 2,
            title: '新增',
            shade: 0.1,
            area: ['550px', '550px'],
            content: MODULE_PATH + 'add'
        })
    }

    window.edit = function (obj) {
        layer.open({
            type: 2,
            title: '修改',
            shade: 0.1,
            area: ['550px', '500px'],
            content: MODULE_PATH + 'edit/' + obj.data['id']
        })
    }

    window.remove = function (obj) {
        layer.confirm('确定要删除该用户', { icon: 3, title: '提示' }, function (index) {
            layer.close(index)
            let loading = layer.load()
            $.ajax({
                url: MODULE_PATH + 'remove/' + obj.data['id'],
                dataType: 'json',
                type: 'delete',
                success: function (result) {
                    layer.close(loading)
                    if (result.success) {
                        popup.success(result.msg, function () {
                            obj.del()
                        })
                    } else {
                        popup.failure(result.msg)
                    }
                }
            })
        })
    }


    window.refresh = function (param) {
        table.reload('user-table', { where: param })
    }
})
