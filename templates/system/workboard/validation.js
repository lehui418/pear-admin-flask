// ECharts 错误处理验证脚本
// 这个脚本用于验证我们的 safeSetOption 函数是否能正确处理各种错误情况

console.log('=== ECharts 错误处理验证开始 ===');

// 模拟图表配置
const mockCharts = {
    testChart: { instance: null, loading: false, error: false }
};

// 模拟 showChartError 函数
function showChartError(chartId, message) {
    console.error(`[${chartId}] 图表错误: ${message}`);
}

// 复制 safeSetOption 函数进行测试
function safeSetOption(chartId, option, notMerge) {
    try {
        console.log(`safeSetOption - 开始处理图表: ${chartId}`);
        
        // 检查图表配置是否存在
        if (!mockCharts || !mockCharts[chartId]) {
            console.error(`safeSetOption - 图表配置不存在: ${chartId}`);
            showChartError(chartId, `图表配置不存在: ${chartId}`);
            return false;
        }
        
        // 检查图表实例是否存在
        if (!mockCharts[chartId].instance) {
            console.error(`safeSetOption - 图表实例不存在: ${chartId}`);
            showChartError(chartId, `图表实例不存在，请检查DOM元素和初始化过程`);
            return false;
        }
        
        // 检查实例是否有setOption方法
        if (typeof mockCharts[chartId].instance.setOption !== 'function') {
            console.error(`safeSetOption - 图表实例没有setOption方法: ${chartId}`);
            showChartError(chartId, `图表实例无效，缺少setOption方法`);
            return false;
        }
        
        // 检查option参数
        if (!option || typeof option !== 'object') {
            console.error(`safeSetOption - option参数无效: ${chartId}`, option);
            showChartError(chartId, `图表配置参数无效`);
            return false;
        }
        
        // 检查series数据
        if (option.series) {
            if (!Array.isArray(option.series)) {
                console.error(`safeSetOption - series不是数组: ${chartId}`);
                showChartError(chartId, `图表数据格式错误：series必须是数组`);
                return false;
            }
            
            if (option.series.length === 0) {
                console.warn(`safeSetOption - series数组为空: ${chartId}`);
            }
            
            for (let i = 0; i < option.series.length; i++) {
                const seriesItem = option.series[i];
                if (!seriesItem || typeof seriesItem !== 'object') {
                    console.error(`safeSetOption - series[${i}]无效: ${chartId}`, seriesItem);
                    showChartError(chartId, `图表数据错误：series[${i}]无效`);
                    return false;
                }
                
                if (seriesItem.data !== undefined && !Array.isArray(seriesItem.data)) {
                    console.error(`safeSetOption - series[${i}].data不是数组: ${chartId}`, seriesItem.data);
                    showChartError(chartId, `图表数据错误：series[${i}].data必须是数组`);
                    return false;
                }
            }
        }
        
        console.log(`safeSetOption - 所有验证通过，调用setOption: ${chartId}`);
        mockCharts[chartId].instance.setOption(option, notMerge);
        console.log(`safeSetOption - setOption调用成功: ${chartId}`);
        return true;
        
    } catch (error) {
        console.error(`safeSetOption - 调用setOption时发生错误: ${chartId}`, error);
        console.error('错误堆栈:', error.stack);
        showChartError(chartId, `图表渲染失败：${error.message}`);
        return false;
    }
}

// 验证测试函数
function runValidationTests() {
    console.log('\n--- 开始运行验证测试 ---');
    
    let passedTests = 0;
    let totalTests = 0;
    
    function assertTest(testName, condition, expectedResult) {
        totalTests++;
        const result = condition === expectedResult;
        if (result) {
            passedTests++;
            console.log(`✅ ${testName}: 通过`);
        } else {
            console.error(`❌ ${testName}: 失败 (期望: ${expectedResult}, 实际: ${condition})`);
        }
        return result;
    }
    
    // 测试1: 图表配置不存在
    console.log('\n测试1: 图表配置不存在');
    const result1 = safeSetOption('nonExistentChart', {}, true);
    assertTest('图表配置不存在检测', result1, false);
    
    // 测试2: 图表实例不存在
    console.log('\n测试2: 图表实例不存在');
    const result2 = safeSetOption('testChart', {}, true);
    assertTest('图表实例不存在检测', result2, false);
    
    // 测试3: 有效的option参数
    console.log('\n测试3: 有效option参数');
    mockCharts.testChart.instance = {
        setOption: function(option, notMerge) {
            console.log('Mock setOption called with:', option);
        }
    };
    
    const validOption = {
        title: { text: '测试图表' },
        series: [{
            name: '数据',
            type: 'bar',
            data: [1, 2, 3, 4, 5]
        }]
    };
    
    const result3 = safeSetOption('testChart', validOption, true);
    assertTest('有效option参数处理', result3, true);
    
    // 测试4: 无效option参数 (null)
    console.log('\n测试4: 无效option参数 (null)');
    const result4 = safeSetOption('testChart', null, true);
    assertTest('无效option参数检测 (null)', result4, false);
    
    // 测试5: 无效option参数 (非对象)
    console.log('\n测试5: 无效option参数 (非对象)');
    const result5 = safeSetOption('testChart', 'invalid', true);
    assertTest('无效option参数检测 (字符串)', result5, false);
    
    // 测试6: series不是数组
    console.log('\n测试6: series不是数组');
    const invalidOption1 = {
        title: { text: '错误图表' },
        series: 'invalid series'
    };
    const result6 = safeSetOption('testChart', invalidOption1, true);
    assertTest('series非数组检测', result6, false);
    
    // 测试7: series项无效
    console.log('\n测试7: series项无效');
    const invalidOption2 = {
        title: { text: '错误图表' },
        series: [null, 'invalid', undefined]
    };
    const result7 = safeSetOption('testChart', invalidOption2, true);
    assertTest('无效series项检测', result7, false);
    
    // 测试8: series.data不是数组
    console.log('\n测试8: series.data不是数组');
    const invalidOption3 = {
        title: { text: '错误图表' },
        series: [{
            name: '数据',
            type: 'bar',
            data: 'invalid data'
        }]
    };
    const result8 = safeSetOption('testChart', invalidOption3, true);
    assertTest('series.data非数组检测', result8, false);
    
    // 测试9: 空series数组 (警告但允许)
    console.log('\n测试9: 空series数组');
    const emptySeriesOption = {
        title: { text: '空图表' },
        series: []
    };
    const result9 = safeSetOption('testChart', emptySeriesOption, true);
    assertTest('空series数组处理', result9, true);
    
    // 测试10: 没有series的option (允许)
    console.log('\n测试10: 没有series的option');
    const noSeriesOption = {
        title: { text: '标题图表' }
    };
    const result10 = safeSetOption('testChart', noSeriesOption, true);
    assertTest('无series option处理', result10, true);
    
    // 总结
    console.log('\n' + '='.repeat(50));
    console.log(`验证测试完成: ${passedTests}/${totalTests} 测试通过`);
    
    if (passedTests === totalTests) {
        console.log('🎉 所有测试通过！SafeSetOption 函数工作正常。');
    } else {
        console.error(`⚠️  ${totalTests - passedTests} 个测试失败，需要检查实现。`);
    }
    
    console.log('='.repeat(50));
    
    return passedTests === totalTests;
}

// 运行验证测试
const allTestsPassed = runValidationTests();

// 导出结果供其他脚本使用
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { safeSetOption, runValidationTests, allTestsPassed };
}