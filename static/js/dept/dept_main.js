layui.use(['form', 'jquery', 'popup', 'treeTable'], function () {
    let form = layui.form
    let $ = layui.jquery
    let treeTable = layui.treeTable
    let popup = layui.popup

    let MODULE_PATH = '/system/dept/'

    window.render = function () {
        treeTable.render({
            skin: 'line',
            method: 'post',
            toolbar: '#dept-toolbar',
            elem: '#dept-table',
            url: MODULE_PATH + 'data',
            page: false,
            tree: {
                customName: { name: 'dept_name' }
            },
            cols: [
                [
                    { type: 'checkbox', fixed: 'left' },
                    { field: 'id', width: 100, title: '编号' },
                    { field: 'dept_name', title: '部门名称', width: 200 },
                    { field: 'leader', title: '负责人', width: 100 },
                    { field: 'phone', title: '联系方式' },
                    { field: 'email', title: '邮箱' },
                    { field: 'address', title: '详细地址' },
                    { field: 'status', title: '状态', templet: '#dept-status' },
                    { field: 'sort', title: '排序', width: 50 },
                    { title: '操作', templet: '#dept-bar', width: 150, align: 'center' }
                ]
            ],
            done: function (res, curr, count, origin) {
                treeTable.expandAll('dept-table', true)
            }
        })
    }

    form.on('submit(dept-query)', function (data) {
        var keyword = data.field.deptName;

        if (!keyword) {
            layer.msg('搜索内容为空', {
                icon: 3,
                time: 1000
            })
            return false;
        }

        treeTable.checkAllNodes('dept-table', false);

        var expandNotes = [];

        treeTable.getNodesByFilter('dept-table', function (item) {
            if (item.dept_name.indexOf(keyword) !== -1) {
                treeTable.setRowChecked('dept-table', { index: item, checked: true });

                // 遍历其全部父元素
                var parent_id = item.parent_id;

                while (parent_id !== 0) {

                    if (!expandNotes.includes(parent_id)) {
                        expandNotes.push(item.LAY_DATA_INDEX);
                    }

                    item = treeTable.getNodeById('dept-table', item.parent_id).data;
                    parent_id = item.parent_id;
                }


                if (!expandNotes.includes(parent_id)) {
                    expandNotes.push(item.LAY_DATA_INDEX);
                }

                return true;
            }


        })

        treeTable.expandAll('dept-table', false);

        expandNotes.forEach(function (note_id) {
            treeTable.expandNode('dept-table', {
                index: note_id,
                expandFlag: true
            });
        })

        return false;
    })

    render()

    treeTable.on('tool(dept-table)', function (obj) {
        if (obj.event === 'remove') {
            window.remove(obj)
        } else if (obj.event === 'edit') {
            window.edit(obj)
        }
    })

    treeTable.on('toolbar(dept-table)', function (obj) {
        if (obj.event === 'add') {
            window.add()
        } else if (obj.event === 'refresh') {
            window.refresh()
        } else if (obj.event === 'batchRemove') {
            window.batchRemove(obj)
        }
    })

    form.on('switch(dept-enable)', function (obj) {
        let operate
        if (obj.elem.checked) {
            operate = 'enable'
        } else {
            operate = 'disable'
        }
        let loading = layer.load()
        $.ajax({
            url: MODULE_PATH + operate,
            data: JSON.stringify({ deptId: this.value }),
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
            area: ['450px', '500px'],
            content: MODULE_PATH + 'add'
        })
    }

    window.edit = function (obj) {
        layer.open({
            type: 2,
            title: '修改',
            shade: 0.1,
            area: ['450px', '500px'],
            content: MODULE_PATH + 'edit?deptId=' + obj.data['id']
        })
    }

    window.remove = function (obj) {
        layer.confirm('确定要删除该部门', { icon: 3, title: '提示' }, function (index) {
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
                            treeTable.removeNode('dept-table', obj.data.LAY_DATA_INDEX)
                        })
                    } else {
                        popup.failure(result.msg)
                    }
                }
            })
        })
    }

    window.batchRemove = function (obj) {
        let data = treeTable.checkStatus(obj.config.id).data
        if (data.length === 0) {
            layer.msg('未选中数据', {
                icon: 3,
                time: 1000
            })
            return false
        }
        var ids = []
        var hasCheck = treeTable.checkStatus('dept-table')
        var hasCheckData = hasCheck.data
        if (hasCheckData.length > 0) {
            $.each(hasCheckData, function (index, element) {
                ids.push(element.id)
            })
        }
        layer.confirm('确定要删除选中部门', {
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
                            treeTable.reload('dept-table');
                        })
                    } else {
                        popup.failure(result.msg)
                    }
                }
            })
        })
    }

})
