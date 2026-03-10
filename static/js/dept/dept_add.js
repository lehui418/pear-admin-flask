layui.use(['form', 'jquery', 'dtree'], function () {
    let form = layui.form
    let $ = layui.jquery
    let dtree = layui.dtree

    dtree.renderSelect({
        elem: '#selectParent',
        url: DEPT_TREE_URL,
        method: 'get',
        selectInputName: { nodeId: 'parentId', context: 'parentName' },
        skin: 'layui',
        dataFormat: 'list',
        response: { treeId: 'id', parentId: 'parent_id', title: 'dept_name' },
        selectInitVal: '1'
    })

    form.on('submit(dept-save)', function (data) {
        $.ajax({
            url: DEPT_SAVE_URL,
            data: JSON.stringify(data.field),
            dataType: 'json',
            contentType: 'application/json',
            type: 'post',
            success: function (result) {
                if (result.success) {
                    layer.msg(result.msg, { icon: 1, time: 1000 }, function () {
                        parent.layer.close(parent.layer.getFrameIndex(window.name))
                        parent.render()
                    })
                } else {
                    layer.msg(result.msg, { icon: 2, time: 1000 })
                }
            }
        })
        return false
    })
})
