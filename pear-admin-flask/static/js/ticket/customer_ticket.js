/**
 * 客户工单管理页面 JavaScript
 * 包含客户工单列表展示、搜索、认领、编辑等功能
 */

layui.use(['table', 'form', 'jquery'], function () {
    let table = layui.table;
    let form = layui.form;
    let $ = layui.jquery;

    // 初始化页面功能
    initTable(table, $);
    initTableEvents(table, $);
    initSearchEvents(table, form, $);
});

/**
 * 初始化表格配置和渲染
 * @param {Object} table - Layui table 模块
 * @param {Object} $ - jQuery 对象
 */
function initTable(table, $) {
    let cols = getTableColumns();

    table.render({
        elem: '#dataTable',
        url: '/system/ticket/customer_table',
        page: true,
        cols: cols,
        skin: 'line',
        toolbar: '#toolbar',
        defaultToolbar: ['filter', 'print', 'exports'],
        height: 'full-180',
        even: true,
        cellMinWidth: 80,
        limit: 15,
        limits: [15, 30, 50, 100],
        text: { none: '暂无相关数据' },
        where: {
            source: 'wechat',
            status: '待分配'
        }
    });
}

/**
 * 获取表格列配置
 * @returns {Array} 表格列配置数组
 */
function getTableColumns() {
    return [
        [
            { type: 'checkbox' },
            {
                field: 'id',
                title: '工单ID',
                sort: true,
                align: 'center',
                width: 80
            },
            {
                field: 'title',
                title: '工单标题',
                sort: true,
                align: 'left',
                width: 280
            },
            {
                field: 'submitter_company',
                title: '客户单位',
                sort: true,
                align: 'center',
                width: 150
            },
            {
                field: 'submitter_contact',
                title: '联系人',
                sort: true,
                align: 'center',
                width: 100
            },
            {
                field: 'status',
                title: '状态',
                sort: true,
                align: 'center',
                width: 100,
                templet: '#status-tpl'
            },
            {
                field: 'assignee_name',
                title: '分配人',
                sort: true,
                align: 'center',
                width: 100
            },
            {
                field: 'create_time',
                title: '提交时间',
                sort: true,
                align: 'center',
                width: 160
            },
            {
                title: '操作',
                toolbar: '#user-bar',
                align: 'center',
                width: 180
            }
        ]
    ];
}

/**
 * 初始化表格行工具条事件
 * @param {Object} table - Layui table 模块
 * @param {Object} $ - jQuery 对象
 */
function initTableEvents(table, $) {
    // 行工具条事件
    table.on('tool(dataTable)', function (obj) {
        if (obj.event === 'view') {
            window.view(obj);
        } else if (obj.event === 'claim') {
            handleClaim(obj);
        } else if (obj.event === 'edit') {
            handleEdit(obj);
        }
    });

    // 工具栏事件
    table.on('toolbar(dataTable)', function (obj) {
        if (obj.event === 'batchClaim') {
            handleBatchClaim(obj);
        }
    });
}

/**
 * 处理认领操作
 * @param {Object} obj - 表格行对象
 */
function handleClaim(obj) {
    if (!HAS_CLAIM_PERMISSION) {
        layer.msg('您没有权限认领工单', { icon: 2 });
        return;
    }

    layer.confirm('确定要认领此工单吗？', function (index) {
        layui.jquery.ajax({
            url: '/system/ticket/claim/' + obj.data.id,
            type: 'POST',
            success: function (res) {
                if (res.code === 0) {
                    layer.msg('认领成功', { icon: 1 });
                    layui.table.reload('dataTable');
                } else {
                    layer.msg(res.msg || '认领失败', { icon: 2 });
                }
            },
            error: function () {
                layer.msg('认领失败，请稍后重试', { icon: 2 });
            }
        });
        layer.close(index);
    });
}

/**
 * 处理批量认领
 * @param {Object} obj - 表格对象
 */
function handleBatchClaim(obj) {
    if (!HAS_CLAIM_PERMISSION) {
        layer.msg('您没有权限认领工单', { icon: 2 });
        return;
    }

    let checkStatus = layui.table.checkStatus('dataTable');
    let data = checkStatus.data;

    if (data.length === 0) {
        layer.msg('请选择要认领的工单', { icon: 0 });
        return;
    }

    // 检查是否都是待分配状态
    let invalidTickets = data.filter(item => item.status !== '待分配');
    if (invalidTickets.length > 0) {
        layer.msg('只能认领待分配状态的工单', { icon: 0 });
        return;
    }

    let ids = data.map(item => item.id).join(',');

    layer.confirm('确定要批量认领选中的 ' + data.length + ' 个工单吗？', function (index) {
        layui.jquery.ajax({
            url: '/system/ticket/batch_claim',
            type: 'POST',
            data: { ids: ids },
            success: function (res) {
                if (res.code === 0) {
                    layer.msg('批量认领成功', { icon: 1 });
                    layui.table.reload('dataTable');
                } else {
                    layer.msg(res.msg || '批量认领失败', { icon: 2 });
                }
            },
            error: function () {
                layer.msg('批量认领失败，请稍后重试', { icon: 2 });
            }
        });
        layer.close(index);
    });
}

/**
 * 处理编辑操作
 * @param {Object} obj - 表格行对象
 */
function handleEdit(obj) {
    if (!HAS_EDIT_PERMISSION) {
        layer.msg('您没有权限编辑此工单', { icon: 2 });
        return;
    }

    // 只有分配人才能编辑
    if (obj.data.assignee_name !== CURRENT_USERNAME && !IS_ADMIN) {
        layer.msg('只有分配人才能编辑此工单', { icon: 2 });
        return;
    }

    window.edit(obj);
}

/**
 * 初始化搜索相关事件
 * @param {Object} table - Layui table 模块
 * @param {Object} form - Layui form 模块
 * @param {Object} $ - jQuery 对象
 */
function initSearchEvents(table, form, $) {
    // 搜索按钮事件
    $('#searchBtn').on('click', function () {
        performSearch(layui.table);
    });

    // 重置按钮事件
    $('#resetBtn').on('click', function () {
        resetSearch(layui.table, layui.form);
    });
}

/**
 * 执行搜索
 * @param {Object} table - Layui table 模块
 */
function performSearch(table) {
    var searchParams = getSearchParams();

    table.reload('dataTable', {
        page: { curr: 1 },
        where: searchParams
    });
}

/**
 * 获取搜索参数
 * @returns {Object} 搜索参数对象
 */
function getSearchParams() {
    var $ = layui.jquery;
    return {
        source: 'wechat',
        keyword: $('#searchKeyword').val(),
        status: $('#searchStatus').val(),
        company: $('#searchCompany').val(),
        contact: $('#searchContact').val(),
        assignee: $('#searchAssignee').val(),
        date: $('#searchDate').val()
    };
}

/**
 * 重置搜索
 * @param {Object} table - Layui table 模块
 * @param {Object} form - Layui form 模块
 */
function resetSearch(table, form) {
    var $ = layui.jquery;
    $('#searchKeyword').val('');
    $('#searchStatus').val('待分配');
    $('#searchCompany').val('');
    $('#searchContact').val('');
    $('#searchAssignee').val('');
    $('#searchDate').val('');
    form.render('select');

    table.reload('dataTable', {
        page: { curr: 1 },
        where: {
            source: 'wechat',
            status: '待分配'
        }
    });
}

/**
 * 查看工单详情
 * @param {Object} obj - 表格行对象
 */
window.view = function (obj) {
    layer.open({
        type: 2,
        title: '查看客户工单',
        content: '/system/ticket/view/' + obj.data.id,
        area: ['90%', '90%'],
        maxmin: true
    });
};

/**
 * 编辑工单
 * @param {Object} obj - 表格行对象
 */
window.edit = function (obj) {
    layer.open({
        type: 2,
        title: '处理客户工单',
        content: '/system/ticket/edit/' + obj.data.id,
        area: ['90%', '90%'],
        maxmin: true,
        end: function () {
            layui.table.reload('dataTable');
        }
    });
};
