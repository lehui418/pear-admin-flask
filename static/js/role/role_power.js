layui.use(['dtree', 'form', 'jquery'], function () {
    let dtree = layui.dtree
    let form = layui.form
    let $ = layui.jquery

    dtree.render({
        elem: '#role-power',
        method: 'get',
        url: GET_ROLE_POWER_URL,
        dataFormat: 'list',
        checkbar: true,
        skin: 'layui',
        initLevel: '1',
        checkbarType: 'self',
        response: { treeId: 'powerId', parentId: 'parentId', title: 'powerName' },
    })

    form.on('submit(power-save)', function (data) {
        let param = dtree.getCheckbarNodesParam('role-power')
        let ids = ''
        for (let i = 0; i < param.length; i++) {
            let id = param[i].nodeId
            ids += id + ','
        }
        ids = ids.substr(0, ids.length - 1)
        
        // 设置角色ID和权限ID
        data.field.roleId = ROLE_ID
        data.field.powerIds = ids

        $.ajax({
            url: SAVE_ROLE_POWER_URL,
            data: data.field,
            dataType: 'json',
            type: 'put',
            success: function (result) {
                if (result.success) {
                    layer.msg(result.msg, { icon: 1, time: 1000 }, function () {
                        parent.layer.close(parent.layer.getFrameIndex(window.name))
                    })
                } else {
                    layer.msg(result.msg, { icon: 2, time: 1000 })
                }
            }
        })
        return false
    })
})
