/**
 * 系统监控页面 JavaScript
 * 包含主机监控、内存监控、磁盘信息展示和 ECharts 图表
 */

// 全局变量，存储获取到的系统信息对象
var systemInfo = null;

/**
 * 格式化内存大小
 * @param {number} memory - 内存字节数
 * @returns {string} 格式化后的内存大小字符串
 */
function memoryFormat(memory) {
    if (memory >= 1024 ** 4 * 2) {
        return (memory / 1024 ** 4).toFixed(2) + 'TB';
    } else if (memory >= 1024 ** 3 * 2) {
        return (memory / 1024 ** 3).toFixed(2) + 'GB';
    } else if (memory >= 1024 ** 2 * 2) {
        return (memory / 1024 ** 2).toFixed(2) + 'MB';
    } else if (memory >= 1024 ** 1 * 2) {
        return (memory / 1024 ** 1).toFixed(2) + 'KB';
    } else {
        return memory + 'B';
    }
}

/**
 * 显示磁盘详细信息弹窗
 * @param {number} index - 磁盘分区索引
 */
function diskinfo(index) {
    var data = systemInfo.disk_partitions_list[index];

    layui.laytpl(`
        <ul>
            <li>分区类型: <%= d.fstype %></li>
            <li>磁盘大小: <%= memoryFormat(d.total) %></li>
            <li>空闲大小: <%= memoryFormat(d.free) %></li>
            <li>已经使用: <%= memoryFormat(d.used) %> (<%= d.percent %>%)</li>
        </ul>
    `, {
        open: '<%',
        close: '%>'
    }).render(data, function (string) {
        layui.layer.alert(string);
    });
}

/**
 * 关闭程序
 */
function kill() {
    var success = true;
    layui.$.ajax({
        url: "/system/monitor/kill",
        success: function (res) {
            layui.popup.failure(res.msg);
            success = false;
        },
        complete: function (xhr) {
            if (success) layui.popup.success("已发送关闭命令。");
        }
    });
}

/**
 * 初始化监控页面
 */
function initMonitor() {
    layui.use(['layer', 'echarts', 'popup'], function () {
        var $ = layui.jquery,
            echarts = layui.echarts;
        let popup = layui.popup;
        let laytpl = layui.laytpl;

        // 检查图表容器是否存在
        var chartContainer = document.getElementById('echarts-records');
        if (!chartContainer) {
            console.warn('未找到图表容器: echarts-records');
            return;
        }

        var echartsRecords = echarts.init(chartContainer, 'walden');

        // 主机信息卡片悬浮提示
        $('#host-info-card').hover(
            function () {
                $('#tooltip').addClass('show');

                // 获取 #cpus_percent-card 的位置、尺寸和宽度
                const card = $(this);
                const cardOffset = card.offset(); // 元素相对于文档的偏移量
                const cardHeight = card.outerHeight(); // 元素的高度
                const cardWidth = card.outerWidth(); // 元素的宽度

                // 设置悬浮提示框的宽度和位置
                $('#tooltip').css({
                    top: cardOffset.top + cardHeight + 2, // 放在元素下方 5px
                    left: cardOffset.left - 5, // 与元素左对齐
                    width: cardWidth - 10, // 宽度与元素一致
                });
            },
            function () {
                $('#tooltip').removeClass('show');
            }
        );

        // Tab 点击事件
        $("body").on("click", "[data-url]", function () {
            parent.layui.tab.addTabOnlyByElem("content", {
                id: $(this).attr("data-id"),
                title: $(this).attr("data-title"),
                url: $(this).attr("data-url"),
                close: true
            });
        });

        // 图表颜色配置
        let color = [
            "#0090FF",
            "#36CE9E",
            "#FFC005",
            "#FF515A",
            "#8B5CFF",
            "#00CA69"
        ];

        // 十六进制颜色转 RGBA
        const hexToRgba = (hex, opacity) => {
            let rgbaColor = "";
            let reg = /^#[\da-f]{6}$/i;
            if (reg.test(hex)) {
                rgbaColor =
                    `rgba(${parseInt("0x" + hex.slice(1, 3))},${parseInt(
                        "0x" + hex.slice(3, 5)
                    )},${parseInt("0x" + hex.slice(5, 7))},${opacity})`;
            }
            return rgbaColor;
        };

        let echartData = [];

        // ECharts 配置选项
        var option = {
            backgroundColor: 'transparent',
            color: color,
            legend: {
                right: 10,
                top: 10
            },
            tooltip: {
                trigger: "axis",
                axisPointer: {
                    type: 'shadow',
                    shadowStyle: {
                        shadowColor: 'rgba(225,225,225,1)',
                        shadowBlur: 5
                    }
                }
            },
            grid: {
                backgroundColor: 'transparent',
                top: 100,
                containLabel: true
            },
            xAxis: [{
                type: "category",
                boundaryGap: false,
                axisLabel: {
                    formatter: '{value}',
                    textStyle: {
                        color: "#333"
                    }
                },
                axisLine: {
                    lineStyle: {
                        color: "#D9D9D9"
                    }
                },
                data: null
            }],
            yAxis: [{
                type: "value",
                name: '单位：百分比',
                axisLabel: {
                    textStyle: {
                        color: "#666"
                    }
                },
                nameTextStyle: {
                    color: "#666",
                    fontSize: 12,
                    lineHeight: 40
                },
                splitLine: {
                    lineStyle: {
                        type: "dashed",
                        color: "#E9E9E9"
                    }
                },
                axisLine: {
                    show: false
                },
                axisTick: {
                    show: false
                }
            }],
            series: [{
                name: "CPU",
                type: "line",
                smooth: true,
                symbolSize: 8,
                zlevel: 3,
                lineStyle: {
                    normal: {
                        color: color[0],
                        shadowBlur: 3,
                        shadowColor: hexToRgba(color[0], 0.5),
                        shadowOffsetY: 8
                    }
                },
                areaStyle: {
                    normal: {
                        color: new echarts.graphic.LinearGradient(
                            0,
                            0,
                            0,
                            1,
                            [{
                                offset: 0,
                                color: hexToRgba(color[0], 0.3)
                            },
                                {
                                    offset: 1,
                                    color: hexToRgba(color[0], 0.1)
                                }
                            ],
                            false
                        ),
                        shadowColor: hexToRgba(color[0], 0.1),
                        shadowBlur: 10
                    }
                },
                data: null
            }, {
                name: '内存',
                type: "line",
                smooth: true,
                symbolSize: 8,
                zlevel: 3,
                lineStyle: {
                    normal: {
                        color: color[1],
                        shadowBlur: 3,
                        shadowColor: hexToRgba(color[1], 0.5),
                        shadowOffsetY: 8
                    }
                },
                areaStyle: {
                    normal: {
                        color: new echarts.graphic.LinearGradient(
                            0,
                            0,
                            0,
                            1,
                            [{
                                offset: 0,
                                color: hexToRgba(color[1], 0.3)
                            },
                                {
                                    offset: 1,
                                    color: hexToRgba(color[1], 0.1)
                                }
                            ],
                            false
                        ),
                        shadowColor: hexToRgba(color[1], 0.1),
                        shadowBlur: 10
                    }
                },
                data: null
            }]
        };

        echartsRecords.setOption(option);

        // 窗口大小改变时重新调整图表
        window.onresize = function () {
            echartsRecords.resize();
        };

        // 启动 AJAX 轮询
        ajaxPolling();
        setInterval(ajaxPolling, 1000 * 5);

        /**
         * AJAX 轮询获取系统监控数据
         */
        function ajaxPolling() {
            $.ajax({
                url: "/system/monitor/polling",
                success: function (result) {
                    var data = result.data;
                    systemInfo = data;

                    // 更新 CPU 信息
                    updateCpuInfo(data);

                    // 更新内存信息
                    updateMemoryInfo(data);

                    // 更新基本信息
                    updateBasicInfo(data);

                    // 更新 CPU 核心使用率提示
                    updateCpuTooltip(data, laytpl);

                    // 更新硬盘信息
                    updateDiskInfo(data, laytpl);

                    // 更新图表
                    updateChart(data, echartsRecords, option);
                },
                error: function (xhr, type, errorThrown) {
                    console.error('监控数据获取失败:', errorThrown);
                }
            });
        }
    });
}

/**
 * 更新 CPU 信息
 * @param {Object} data - 系统监控数据
 */
function updateCpuInfo(data) {
    var cpuCountEl = document.querySelector("#cpu_count");
    var cpusPercentEl = document.querySelector("#cpus_percent");
    var cpuIdlePercentEl = document.querySelector("#cpu_idle_percent");
    var cpuWaitPercentEl = document.querySelector("#cpu_wait_percent");

    if (cpuCountEl) cpuCountEl.innerText = data.cpu_count;
    if (cpusPercentEl) cpusPercentEl.innerText = data.cpus_percent + "%";
    if (cpuIdlePercentEl) cpuIdlePercentEl.innerText = data.cpu_idle_percent + "%";
    if (cpuWaitPercentEl) cpuWaitPercentEl.innerText = data.cpu_wait_percent + "%";
}

/**
 * 更新内存信息
 * @param {Object} data - 系统监控数据
 */
function updateMemoryInfo(data) {
    var memoryUsedEl = document.querySelector("#memory_used");
    var memoryTotalEl = document.querySelector("#memory_total");
    var memoryFreeEl = document.querySelector("#memory_free");
    var memoryUsageEl = document.querySelector("#memory_usage");

    if (memoryUsedEl) memoryUsedEl.innerText = memoryFormat(data.memory_used);
    if (memoryTotalEl) memoryTotalEl.innerText = memoryFormat(data.memory_total);
    if (memoryFreeEl) memoryFreeEl.innerText = memoryFormat(data.memory_free);
    if (memoryUsageEl) memoryUsageEl.innerText = data.memory_usage + "%";
}

/**
 * 更新基本信息
 * @param {Object} data - 系统监控数据
 */
function updateBasicInfo(data) {
    var hostnameEl = document.querySelector("#hostname");
    var systemVersionEl = document.querySelector("#system_version");
    var bootTimeEl = document.querySelector("#boot_time");
    var upTimeFormatEl = document.querySelector("#up_time_format");
    var pythonVersionEl = document.querySelector("#python_version");

    if (hostnameEl) hostnameEl.innerText = data.basic_info.hostname;
    if (systemVersionEl) systemVersionEl.innerText = data.basic_info.system_version;
    if (bootTimeEl) bootTimeEl.innerText = data.basic_info.boot_time;
    if (upTimeFormatEl) upTimeFormatEl.innerText = data.basic_info.up_time_format;
    if (pythonVersionEl) pythonVersionEl.innerText = data.basic_info.python_version;
}

/**
 * 更新 CPU 核心使用率提示
 * @param {Object} data - 系统监控数据
 * @param {Object} laytpl - Layui 模板引擎
 */
function updateCpuTooltip(data, laytpl) {
    var tooltipCpusEl = document.querySelector("#tooltip-cpus");
    if (!tooltipCpusEl) return;

    laytpl(`
        <ul>
            <%# layui.each(d, function(index, data){ %>
            <li>
                <span class="layui-badge layui-bg-blue">CPU <%= data[0] %>: <%= data[1] %>%</span>
            </li>
            <%#  }); %>
        </ul>
    `, {
        open: '<%',
        close: '%>'
    }).render(data.cpu_percent_per_core, function (string) {
        tooltipCpusEl.innerHTML = string;
    });
}

/**
 * 更新硬盘信息
 * @param {Object} data - 系统监控数据
 * @param {Object} laytpl - Layui 模板引擎
 */
function updateDiskInfo(data, laytpl) {
    var diskInfoCardEl = document.querySelector("#disk-info-card");
    if (!diskInfoCardEl) return;

    laytpl(`
        <fieldset class="layui-elem-field layui-field-title"></fieldset>
        <%# layui.each(d, function(index, data){ %>
        <div class="layui-row" style="display: flex; align-items: center;">
            <div class="progress-ring" style="margin-right: 50px;">
                <svg class="circle" width="120" height="120" viewBox="0 0 120 120">
                    <circle class="circle-bg" cx="60" cy="60" r="54"/>
                    <circle class="circle-progress" cx="60" cy="60" r="54" style="--progress: <%= data.percent %>"/>
                </svg>
                <div class="progress-text"><%= data.device %></div>
            </div>
            <div class="layui-col-space10" style="display: flex; align-items: center;">
                <ul>
                    <li>分区类型: <%= data.fstype %></li>
                    <li>磁盘大小: <%= memoryFormat(data.total) %></li>
                    <li>空闲大小: <%= memoryFormat(data.free) %></li>
                    <li>已经使用: <%= memoryFormat(data.used) %> (<%= data.percent %>%)</li>
                    <li>
                        <a href="javascript:diskinfo(<%= index %>)" data-id="1"
                           class="layui-btn layui-btn-xs layui-btn-primary pear-reply">查看详情
                        </a>
                    </li>
                </ul>
            </div>
        </div>
        <fieldset class="layui-elem-field layui-field-title"></fieldset>
        <%# }) %>
    `, {
        open: '<%',
        close: '%>'
    }).render(data.disk_partitions_list, function (string) {
        diskInfoCardEl.innerHTML = string;
    });
}

/**
 * 更新 ECharts 图表
 * @param {Object} data - 系统监控数据
 * @param {Object} echartsRecords - ECharts 实例
 * @param {Object} option - ECharts 配置选项
 */
function updateChart(data, echartsRecords, option) {
    // 获取全局的 echartData，如果不存在则初始化
    if (typeof window.echartData === 'undefined') {
        window.echartData = [];
    }

    window.echartData.push({
        name: data.time_now,
        cpu_percent: data.cpus_percent,
        memory_percent: data.memory_usage
    });

    if (window.echartData.length > 8) {
        window.echartData.shift();
    }

    var xAxisData = window.echartData.map(v => v.name);
    var yAxisData1 = window.echartData.map(v => v.cpu_percent);
    var yAxisData2 = window.echartData.map(v => v.memory_percent);

    option.xAxis[0].data = xAxisData;
    option.series[0].data = yAxisData1;
    option.series[1].data = yAxisData2;

    echartsRecords.setOption(option);
}

// 页面加载完成后初始化
layui.use(['layer', 'echarts', 'popup'], function () {
    initMonitor();
});
