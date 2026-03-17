/**
 * 工单管理页面 JavaScript
 * 包含工单列表展示、搜索、导出、增删改查等功能
 */

var basePath = '/'; // Adjust if your app is not at the root

/**
 * 初始化 Layui 模块和页面功能
 */
layui.use(['table', 'form', 'jquery', 'laydate'], function () {
    let table = layui.table;
    let form = layui.form;
    let $ = layui.jquery;
    let laydate = layui.laydate;

    // 初始化页面功能
    initSearchToggle($);
    initTable(table, $);
    initTableEvents(table, $);
    initToolbarEvents(table, $);
    initSearchEvents(table, form, $);
});

/**
 * 初始化搜索区域展开/收起功能
 * @param {Object} $ - jQuery 对象
 */
function initSearchToggle($) {
    // 搜索图标点击事件 - 显示/隐藏搜索区域
    $(document).on('click', '.layui-icon-search', function(e) {
        // 检查是否点击的是表格工具栏中的搜索图标
        if ($(this).closest('.layui-table-tool').length > 0) {
            let searchArea = $('#searchArea');
            searchArea.toggleClass('show');
            
            // 如果显示搜索区域，重新渲染表单元素
            if (searchArea.hasClass('show')) {
                layui.form.render();
            }
        }
    });
    
    // 高级筛选展开/收起
    $('#toggleAdvancedSearch').on('click', function () {
        let advancedArea = $('#advancedSearchArea');
        let icon = $(this).find('i');
        
        if (advancedArea.hasClass('show')) {
            advancedArea.removeClass('show');
            icon.removeClass('layui-icon-up').addClass('layui-icon-down');
        } else {
            advancedArea.addClass('show');
            icon.removeClass('layui-icon-down').addClass('layui-icon-up');
            // 重新渲染表单元素
            layui.form.render();
        }
    });
}

/**
 * 初始化表格配置和渲染
 * @param {Object} table - Layui table 模块
 * @param {Object} $ - jQuery 对象
 */
function initTable(table, $) {
    let cols = getTableColumns();

    table.render({
        elem: '#dataTable',
        url: basePath + 'system/ticket/table',
        page: true,
        cols: cols,
        skin: 'line',
        toolbar: '#toolbar',
        defaultToolbar: [{
            layEvent: 'refresh',
            icon: 'layui-icon-refresh',
        }, {
            layEvent: 'toggleSearch',
            icon: 'layui-icon-search',
            title: '显示/隐藏筛选区域'
        }, 'filter', 'print', 'exports'],
        height: 'full-120',
        even: true,
        cellMinWidth: 80,
        limit: 15,
        limits: [15, 30, 50, 100],
        text: { none: '暂无相关数据' }
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
                unresize: false,
                width: 100
            },
            {
                field: 'title',
                title: '工单标题',
                sort: true,
                unresize: false,
                align: 'left',
                width: 240
            },
            {
                field: 'serial_number',
                title: '序列号',
                sort: true,
                unresize: false,
                align: 'center',
                width: 165,
                hide: false
            },
            {
                field: 'priority',
                title: '优先级',
                sort: true,
                unresize: false,
                align: 'center',
                width: 88,
                templet: renderPriority
            },
            {
                field: 'status',
                title: '工单状态',
                sort: true,
                unresize: false,
                align: 'center',
                width: 160,
                templet: renderStatus
            },
            {
                field: 'assignee_name',
                title: '负责人',
                sort: true,
                unresize: false,
                align: 'center',
                width: 100
            },
            {
                field: 'description',
                title: '详细记录',
                sort: true,
                unresize: false,
                align: 'center',
                width: 100,
                hide: true
            },
            {
                field: 'service_method',
                title: '服务方式',
                sort: true,
                unresize: false,
                align: 'center',
                hide: true
            },
            {
                field: 'engineer_id',
                title: '工程师工号',
                sort: true,
                unresize: false,
                align: 'center',
                hide: true
            },
            {
                field: 'product_type_level1',
                title: '产品一级分类',
                sort: true,
                unresize: false,
                align: 'center',
                hide: true
            },
            {
                field: 'product_type_level2',
                title: '产品二级分类',
                sort: true,
                unresize: false,
                align: 'center',
                hide: true
            },
            {
                field: 'version_number',
                title: '版本号',
                sort: true,
                unresize: false,
                align: 'center',
                hide: true
            },
            {
                field: 'is_out_of_warranty',
                title: '是否过保',
                sort: true,
                unresize: false,
                align: 'center',
                hide: true,
                templet: function (d) {
                    return d.is_out_of_warranty ? 'true' : 'false';
                }
            },
            {
                field: 'problem_classification_main',
                title: '问题主分类',
                sort: true,
                unresize: false,
                align: 'center',
                hide: true
            },
            {
                field: 'problem_classification_sub',
                title: '处理记录',
                sort: true,
                unresize: false,
                align: 'center',
                hide: true
            },
            {
                field: 'create_time',
                title: '创建时间',
                templet: '#file-uploadTime',
                sort: true,
                unresize: false,
                align: 'center',
                width: 160
            },
            {
                field: 'update_time',
                title: '更新时间',
                templet: renderUpdateTime,
                sort: true,
                unresize: false,
                align: 'center',
                width: 160
            },
            {
                field: 'order_time',
                title: '接单时间',
                templet: renderOrderTime,
                sort: true,
                unresize: false,
                align: 'center',
                hide: true
            },
            {
                field: 'completion_time',
                title: '完成时间',
                templet: renderCompletionTime,
                sort: true,
                unresize: false,
                align: 'center',
                width: 160
            },
            {
                field: 'status_description',
                title: '状态描述',
                sort: true,
                unresize: false,
                align: 'center',
                hide: true
            },
            {
                field: 'fault_description',
                title: '需求/故障描述',
                sort: true,
                unresize: false,
                align: 'center',
                hide: true
            },
            {
                field: 'solution',
                title: '处置方案',
                sort: true,
                unresize: false,
                align: 'center',
                hide: true
            },
            {
                field: 'customer_agent_name',
                title: '客户/问题信息',
                sort: true,
                unresize: false,
                align: 'center',
                hide: true
            },
            {
                field: 'impact_scope',
                title: '影响范围',
                sort: true,
                unresize: false,
                align: 'center',
                hide: true
            },
            {
                field: 'problem_tags',
                title: '问题标签',
                sort: true,
                unresize: false,
                align: 'center',
                hide: true
            },
            {
                field: 'appointment_time',
                title: '预约时间',
                templet: renderAppointmentTime,
                sort: true,
                unresize: false,
                align: 'center',
                hide: true
            },
            {
                title: '操作',
                toolbar: '#user-bar',
                align: 'center',
                unresize: false,
                width: 180
            }
        ]
    ];
}

/**
 * 渲染优先级列
 * @param {Object} d - 行数据
 * @returns {string} HTML 字符串
 */
function renderPriority(d) {
    if (d.priority === 'P1' || d.priority === 'High') {
        return '<span class="layui-badge layui-bg-red">P1 重大</span>';
    }
    if (d.priority === 'P2') {
        return '<span class="layui-badge layui-bg-orange">P2 主要</span>';
    }
    if (d.priority === 'P3' || d.priority === 'Medium') {
        return '<span class="layui-badge layui-bg-blue">P3 次要</span>';
    }
    if (d.priority === 'P4' || d.priority === 'Low') {
        return '<span class="layui-badge layui-bg-green">P4 咨询</span>';
    }
    return d.priority || '';
}

/**
 * 渲染状态列
 * @param {Object} d - 行数据
 * @returns {string} HTML 字符串
 */
function renderStatus(d) {
    let statusText = '';
    let statusDisplay = d.status_display || d.status;

    // 根据状态应用颜色
    const statusColors = {
        '创建/提交': '#4A90E2',
        '未完成-客户原因': '#FFD700',
        '未完成-研发原因': '#FFA500',
        '未完成-生产原因': '#9B59B6',
        '未完成-售后原因': '#FF6B6B',
        '暂时规避': '#2ECC71',
        '处理中': '#E74C3C',
        '已解决': '#27AE60',
        '已关闭': '#95A5A6'
    };

    if (statusColors[d.status]) {
        statusText = '<span style="color: ' + statusColors[d.status] + '; font-weight: bold;">' + statusDisplay + '</span>';
    } else {
        statusText = '<span class="layui-badge">' + statusDisplay + '</span>';
    }

    if (d.is_overdue === true) {
        statusText += ' <span class="layui-badge layui-bg-red" title="工单已超时">已超时</span>';
    }

    return statusText;
}

/**
 * 渲染更新时间列
 * @param {Object} d - 行数据
 * @returns {string} 格式化后的时间字符串
 */
function renderUpdateTime(d) {
    return d.update_time ? layui.util.toDateString(d.update_time, "yyyy-MM-dd HH:mm:ss") : '';
}

/**
 * 渲染接单时间列
 * @param {Object} d - 行数据
 * @returns {string} 格式化后的时间字符串
 */
function renderOrderTime(d) {
    return d.order_time ? layui.util.toDateString(d.order_time, "yyyy-MM-dd HH:mm:ss") : '';
}

/**
 * 渲染完成时间列
 * @param {Object} d - 行数据
 * @returns {string} 格式化后的时间字符串
 */
function renderCompletionTime(d) {
    return d.completion_time ? layui.util.toDateString(d.completion_time, "yyyy-MM-dd HH:mm:ss") : '';
}

/**
 * 渲染预约时间列
 * @param {Object} d - 行数据
 * @returns {string} 格式化后的时间字符串
 */
function renderAppointmentTime(d) {
    return d.appointment_time ? layui.util.toDateString(d.appointment_time, "yyyy-MM-dd HH:mm:ss") : '';
}

/**
 * 初始化表格行工具条事件
 * @param {Object} table - Layui table 模块
 * @param {Object} $ - jQuery 对象
 */
function initTableEvents(table, $) {
    table.on('tool(dataTable)', function (obj) {
        var currentUsername = CURRENT_USERNAME;

        if (obj.event === 'remove') {
            handleRemove(obj, currentUsername);
        } else if (obj.event === 'edit') {
            handleEdit(obj, currentUsername);
        } else if (obj.event === 'view') {
            window.view(obj);
        }
    });
}

/**
 * 处理删除操作
 * @param {Object} obj - 表格行对象
 * @param {string} currentUsername - 当前用户名
 */
function handleRemove(obj, currentUsername) {
    if (HAS_DELETE_PERMISSION && (IS_ADMIN ||
        (obj.data.user_id && String(obj.data.user_id) == String(CURRENT_USER_ID)) ||
        (obj.data.assignee_name && obj.data.assignee_name == currentUsername))) {
        window.remove(obj);
    } else {
        layer.msg('您没有权限删除此工单', { icon: 2 });
    }
}

/**
 * 处理编辑操作
 * @param {Object} obj - 表格行对象
 * @param {string} currentUsername - 当前用户名
 */
function handleEdit(obj, currentUsername) {
    var problemClass = obj.data.problem_classification_main || '';
    var hasQualityEditPermission = IS_QUALITY_MEMBER && (obj.data.status == '未完成-生产原因' ||
        (problemClass && (problemClass.indexOf('软件bug-需寄回升级包') > -1 || problemClass.indexOf('硬件') > -1)));

    if (HAS_EDIT_PERMISSION && (IS_ADMIN ||
        (obj.data.user_id && String(obj.data.user_id) == String(CURRENT_USER_ID)) ||
        (obj.data.assignee_name && obj.data.assignee_name == currentUsername) ||
        (IS_RD_MEMBER && obj.data.status == '未完成-研发原因') ||
        hasQualityEditPermission)) {
        window.edit(obj);
    } else {
        layer.msg('您没有权限编辑此工单', { icon: 2 });
    }
}

/**
 * 初始化工具栏事件
 * @param {Object} table - Layui table 模块
 * @param {Object} $ - jQuery 对象
 */
function initToolbarEvents(table, $) {
    table.on('toolbar(dataTable)', function (obj) {
        switch (obj.event) {
            case 'add':
                window.add();
                break;
            case 'exportAll':
                window.exportAll();
                break;
            case 'refresh':
                window.refresh();
                break;
            case 'batchRemove':
                window.batchRemove(obj);
                break;
            case 'toggleSearch':
                $('.layui-form.layui-form-pane').slideToggle('fast');
                break;
        }
    });
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
        keyword: $('#searchKeyword').val(),
        status: $('#searchStatus').val(),
        priority: $('#searchPriority').val(),
        assignee: $('#searchAssignee').val(),
        service_method: $('#searchServiceMethod').val(),
        product_type: $('#searchProductType').val(),
        engineer_id: $('#searchEngineerId').val(),
        serial_number: $('#searchSerialNumber').val(),
        version_number: $('#searchVersionNumber').val(),
        problem_main: $('#serial_number').val(),
        relatedinfo: $('#relatedinfo').val(),
        warranty: $('#searchWarranty').val(),
        security_level: $('#searchSecurityLevel').val(),
        threat_type: $('#searchThreatType').val(),
        impact_scope: $('#searchImpactScope').val(),
        description: $('#description').val(),
        product_type_level1: $('#product_type_level1').val(),
        product_type_level2: $('#product_type_level2').val(),
        customer_agent_name: $('#customer_agent_name').val(),
        problem_classification_main: $('#problem_classification_main').val(),
        problem_tags: $('#problem_tags').val(),
        solution: $('#solution').val(),
        order_time: $('#order_time').val(),
        create_time: $('#create_time').val()
    };
}

/**
 * 重置搜索
 * @param {Object} table - Layui table 模块
 * @param {Object} form - Layui form 模块
 */
function resetSearch(table, form) {
    clearSearchFields();
    form.render('select');

    table.reload('dataTable', {
        where: {}
    });
}

/**
 * 清空搜索字段
 */
function clearSearchFields() {
    var $ = layui.jquery;
    var fields = [
        'searchKeyword', 'searchStatus', 'searchPriority', 'searchAssignee',
        'searchServiceMethod', 'searchProductType', 'searchEngineerId',
        'searchSerialNumber', 'searchVersionNumber', 'searchProblemMain',
        'relatedinfo', 'searchWarranty', 'searchSecurityLevel', 'searchThreatType',
        'searchImpactScope', 'description', 'product_type_level1', 'product_type_level2',
        'customer_agent_name', 'impact_scope', 'problem_classification_main',
        'problem_tags', 'solution', 'order_time', 'create_time'
    ];

    fields.forEach(function (field) {
        $('#' + field).val('');
    });
}

/**
 * 获取弹出窗尺寸
 * @returns {Array} [宽度, 高度]
 */
function getScreenSize() {
    var $ = layui.jquery;
    var width = $(window).width() * 0.8;
    var height = $(window).height() - 20;
    return [width + 'px', height + 'px'];
}

// ==================== 全局函数 ====================

/**
 * 新增工单
 */
window.add = function () {
    layer.open({
        type: 2,
        maxmin: true,
        title: '新增工单',
        shade: 0.1,
        area: ['600px', '500px'],
        content: basePath + 'system/ticket/add'
    });
};

/**
 * 导出所有工单
 */
window.exportAll = function () {
    layer.confirm('确定要导出所有工单数据吗？', {
        icon: 3,
        title: '提示'
    }, function (index) {
        layer.close(index);
        performExport();
    });
};

/**
 * 执行导出操作
 */
function performExport() {
    var $ = layui.jquery;
    var loadingIndex = layer.load(1, { shade: [0.3, '#000'] });
    var exportUrl = basePath + 'system/ticket/export';
    var searchParams = getSearchParams();
    var queryString = $.param(searchParams);
    var fullUrl = exportUrl + '?' + queryString;

    var xhr = new XMLHttpRequest();
    xhr.open('GET', fullUrl, true);
    xhr.responseType = 'blob';
    xhr.timeout = 300000;

    xhr.onload = function () {
        layer.close(loadingIndex);
        if (xhr.status === 200) {
            downloadFile(xhr);
            layer.msg('导出成功', { icon: 1, time: 2000 });
        } else {
            layer.msg('导出失败: HTTP ' + xhr.status, { icon: 2, time: 3000 });
        }
    };

    xhr.ontimeout = function () {
        layer.close(loadingIndex);
        layer.msg('导出超时，请减少筛选条件后重试', { icon: 2, time: 3000 });
    };

    xhr.onerror = function () {
        layer.close(loadingIndex);
        layer.msg('导出失败，请稍后重试', { icon: 2, time: 3000 });
    };

    xhr.send();
}

/**
 * 下载文件
 * @param {XMLHttpRequest} xhr - XMLHttpRequest 对象
 */
function downloadFile(xhr) {
    var filename = 'tickets_export.csv';
    var disposition = xhr.getResponseHeader('Content-Disposition');
    if (disposition && disposition.indexOf('attachment') !== -1) {
        var filenameRegex = /filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/;
        var matches = filenameRegex.exec(disposition);
        if (matches != null && matches[1]) {
            filename = matches[1].replace(/['"]/g, '');
        }
    }

    var blob = new Blob([xhr.response], { type: 'text/csv;charset=utf-8' });
    var link = document.createElement('a');
    if (link.download !== undefined) {
        var url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', filename);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    }
}

/**
 * 查看工单详情
 * @param {Object} obj - 表格行对象
 */
window.view = function (obj) {
    var index = layer.open({
        type: 2,
        maxmin: true,
        title: '查看工单 - ' + (obj.data.title || obj.data.id),
        shade: 0.1,
        area: getScreenSize(),
        content: basePath + 'system/ticket/view/' + obj.data.id
    });
    layer.full(index);
};

/**
 * 编辑工单
 * @param {Object} obj - 表格行对象
 */
window.edit = function (obj) {
    var isAssignee = obj.data.assignee_name && obj.data.assignee_name == CURRENT_USERNAME;
    var editUrl = basePath + 'system/ticket/edit/' + obj.data.id;

    if (isAssignee) {
        editUrl += '?is_assignee=true';
    }

    var index = layer.open({
        type: 2,
        maxmin: true,
        title: '编辑工单 - ' + (obj.data.title || obj.data.id),
        shade: 0.1,
        area: getScreenSize(),
        content: editUrl
    });
    layer.full(index);
};

/**
 * 删除工单
 * @param {Object} obj - 表格行对象
 */
window.remove = function (obj) {
    layer.confirm('确定要删除工单：【' + (obj.data.title || obj.data.id) + '】？', {
        icon: 3,
        title: '提示'
    }, function (index) {
        layer.close(index);
        performDelete(obj);
    });
};

/**
 * 执行删除操作
 * @param {Object} obj - 表格行对象
 */
function performDelete(obj) {
    var $ = layui.jquery;
    var loading = layer.load();
    var isAssignee = obj.data.assignee_name && obj.data.assignee_name == CURRENT_USERNAME;

    $.ajax({
        url: basePath + 'system/ticket/delete',
        data: {
            id: obj.data['id'],
            is_assignee: isAssignee
        },
        dataType: 'json',
        type: 'POST',
        success: function (res) {
            layer.close(loading);
            if (res.success) {
                layer.msg(res.msg, { icon: 1, time: 1000 }, function () {
                    obj.del();
                });
            } else {
                layer.msg(res.msg, { icon: 2, time: 1000 });
            }
        }
    });
}

/**
 * 批量删除工单
 * @param {Object} obj - 表格工具条对象
 */
window.batchRemove = function (obj) {
    var $ = layui.jquery;
    var data = layui.table.checkStatus(obj.config.id).data;
    if (data.length === 0) {
        layer.msg('未选中数据', { icon: 3, time: 1000 });
        return false;
    }

    var ids = [];
    $.each(data, function (index, element) {
        ids.push(element.id);
    });

    layer.confirm('确定要批量删除选中的 ' + ids.length + ' 条工单吗？', {
        icon: 3,
        title: '提示'
    }, function (index) {
        layer.close(index);
        performBatchDelete(ids);
    });
};

/**
 * 执行批量删除
 * @param {Array} ids - 工单 ID 数组
 */
function performBatchDelete(ids) {
    var $ = layui.jquery;
    var loading = layer.load();

    $.ajax({
        url: basePath + 'system/ticket/batchDelete',
        data: { 'ids[]': ids },
        dataType: 'json',
        type: 'POST',
        traditional: true,
        success: function (res) {
            layer.close(loading);
            if (res.success) {
                layer.msg(res.msg, { icon: 1, time: 1000 }, function () {
                    layui.table.reload('dataTable');
                });
            } else {
                layer.msg(res.msg, { icon: 2, time: 1000 });
            }
        }
    });
}

/**
 * 刷新表格
 */
window.refresh = function () {
    clearSearchFields();
    layui.form.render('select');
    layui.table.reload('dataTable', { where: {} });
};

/**
 * 查看大图
 * @param {Object} obj - 表格行对象
 */
window.photo = function (obj) {
    if (!obj.data.href || obj.data.href === '') {
        layer.msg('图片地址错误！');
        return;
    }

    var img = new Image();
    img.src = obj.data.href;
    img.onload = function () {
        var autoImg = calculateImageSize(img);
        layer.open({
            type: 1,
            title: false,
            area: ['auto'],
            skin: 'layui-layer-nobg',
            shadeClose: true,
            content: '<img src="' + obj.data['href'] + '" width="' + autoImg.width + 'px" height="' + autoImg.height + 'px">'
        });
    };
};

/**
 * 计算图片显示尺寸
 * @param {Image} img - 图片对象
 * @returns {Object} 包含 width 和 height 的对象
 */
function calculateImageSize(img) {
    var $ = layui.jquery;
    var maxHeight = $(window).height() - 100;
    var maxWidth = $(window).width();
    var rate = Math.min(maxHeight / img.height, maxWidth / img.width, 1);

    return {
        height: img.height * rate,
        width: img.width * rate
    };
}
