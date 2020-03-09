# 小程序原始数据转换函数使用说明
## 一、函数使用目的及文件结构
### 1. 转换函数是为数据指标板块表格和图表的展示而服务的。表格和图表的展示需要特殊的数据结构，但是从后台拿到的原始数据并不满足这种结构。转换函数的作用，就是将detailCharts页面获取到的原始数据转换成图表需要的数据结构。
### 2.index.js是函数入口文件，oldMethod.js文件，是满足原渲染库的转换函数。后来渲染库使用了f2，转换函数也要随之调整，不过由于中间的数据结构无需大的改变，所以新的转换函数是引入了老版本的函数，并在此基础上，进行的修改。
## 二、具体函数作用说明
### 1.概述：index.js页面是针对特殊的图表类型做的数据微调，在此不做赘述，主要来说一些老版本的转换函数中，各个功能函数的作用
### 2.表格中标题行和标题列包含时间数据的系列函数（即singleCategoryUntils）
* reverseSortFun：年份或日期的排序函数，倒序，与sort方法搭配使用
* sortFun：年份或日期的排序函数，正序，与sort方法搭配使用
* handleDataPlace：对数据进行处理，返回特定位数的数据；接收数字，返回数字
* transformDate：日期格式转换函数；接收时间戳和期望得到的日期类型，返回处理好的日期格式
* filterSeries：由结合获取的数据及提前写好的配置，按照categories过滤series数据；接收原始数据中的series和当前指标对应的config，返回处理过后的series
* getYearList：获取年份列表；接收由filterSeries处理后的数据和当前指标配置，返回年份列表
* fillDataByYear：根据得出的年份列表整理数据；接收由filterSeries处理后的数据、年份列表、以及当前指标配置，返回处理后的数据
* addUnitToData：给series数据中的category添加单位；接收fillDataByYear处理后的数据和当前指标配置，返回添加单位后的数据
* packageTheTable：将处理好的数据，整理成table需要的结构；接收年份列表、addUnitToData处理后的数据、以及当前指标配置，返回表格需要的数据结构
* packageTheChart：将处理好的数据，整理成chart需要的结构；接收年份列表、filterSeries处理后的数据、以及当前指标配置项，返回图表需要的数据结构
### 3.表格中标题行和标题列不包含时间数据的系列函数（即multiCategoryUtils）
* handleDataPlace：对数据进行处理，返回特定位数的数据；接收数字，返回数字
* divideDataToGroups：将原始数据按照series分成不同的组；接收原始数据和当前指标配置，返回处理后的数据
* getCategoryList：获取数据的类目列表；接收原始数据和当前指标配置，返回类目列表
* sortDataBySeries：将系列数据与类目列表进行匹配；接收divideDataToGroups处理后的数据和getCategoryList得到的类目列表，返回匹配后的数据
* addUnitToData：给数据添加单位；接收sortDataBySeries处理后的数据和当前指标配置，返回添加好单位后的数据
* packageTheTable：将数据打包成表格需要的格式；接收addUnitToData处理后的数据、getCategoryList处理后的数据、和当前指标配置，返回表格需要的数据格式
* packageTheChart：将数据打包成图表需要的格式；接收divideDataToGroups处理后的数据、sortDataBySeries处理后的数据、getCategoryList处理后的数据、以及当前指标配置，返回图表需要的数据格式
### 4.表格处理函数
* processTableData：表格数据处理，包括：转换表格纵横列、填充部分 series、计算第一列文本高度；接收由步骤3处理过程得到的数据、当前指标配置、表格宽度、高度比例；返回最终的数据结构