layui.use(['form', 'jquery', 'dtree'], function () {
    let form = layui.form
    let $ = layui.jquery

    let dtree = layui.dtree

    dtree.renderSelect({
        elem: '#selectParent',
        url: deptTreeUrl,
        method: 'get',
        selectInputName: { nodeId: 'deptId', context: 'deptName' },
        skin: 'layui',
        dataFormat: 'list',
        response: { treeId: 'id', parentId: 'parent_id', title: 'dept_name' }
    })

    form.on('submit(user-save)', function (data) {
        let roleIds = ''
        $('input[type=checkbox]:checked').each(function () {
            roleIds += $(this).val() + ','
        })
        roleIds = roleIds.substr(0, roleIds.length - 1)
        data.field.roleIds = roleIds

        $.ajax({
            url: userSaveUrl,
            data: JSON.stringify(data.field),
            dataType: 'json',
            contentType: 'application/json',
            type: 'post',
            success: function (result) {
                if (result.success) {
                    layer.msg(result.msg, { icon: 1, time: 1000 }, function () {
                        parent.layer.close(parent.layer.getFrameIndex(window.name))//关闭当前页
                        parent.layui.table.reload('user-table')
                    })
                } else {
                    layer.msg(result.msg, { icon: 2, time: 1000 })
                }
            }
        })
        return false
    })
})
