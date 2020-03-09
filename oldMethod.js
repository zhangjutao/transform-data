import { getDataSource } from '../util';
/* eslint-disable max-len */
const getStringLength = (str) => {
  const strArray = str.toString().split('');
  const lengths = strArray.map((e) => {
    if (e.codePointAt(0) > 128) {
      // 非英文字符
      return 2;
    } if (e.codePointAt(0) >= 64 && e.codePointAt(0) <= 90) {
      // 大写字母和@
      return 2;
    }
    return 1;
  });
  return lengths.reduce((a, b) => (a + b));
};

class singleCategoryUntils {
  // 给日期或年份反向排序
  static reverseSortFun(a, b) {
    if (a < b) {
      return 1;
    }
    return -1;
  }

  // 给日期或年份正向排序
  static sortFun(a, b) {
    if (a < b) {
      return -1;
    }
    return 1;
  }

  // 处理数据位数;接收数字
  static handleDataPlace(data, digits) {
    if (typeof data === 'number') {
      const result = data.toFixed(digits);
      return result;
    }
    return data;
  }

  // 接收时间戳，转化成日期、分钟、小时、年份四种形式
  static transformDate(time) {
    const timeStamp = Number(time);
    const yearPart = (new Date(timeStamp)).getFullYear();
    const weekData = (new Date(timeStamp)).getDay();
    let weekPart;
    switch (weekData) {
      case 1:
        weekPart = '星期一';
        break;
      case 2:
        weekPart = '星期二';
        break;
      case 3:
        weekPart = '星期三';
        break;
      case 4:
        weekPart = '星期四';
        break;
      case 5:
        weekPart = '星期五';
        break;
      case 6:
        weekPart = '星期六';
        break;
      case 0:
        weekPart = '星期日';
        break;
      default:
        weekPart = '星期一';
    }
    let monthPart = ((new Date(timeStamp)).getMonth() + 1).toString();
    let datePart = ((new Date(timeStamp)).getDate()).toString();
    let hourPart = (new Date(timeStamp)).getHours().toString();
    let minutePart = (new Date(timeStamp)).getMinutes().toString();
    // hourPart = hourPart.length === 1 ? `0${hourPart}` : hourPart;
    hourPart = `${hourPart}:00~${Number(hourPart) + 1}:00`;
    minutePart = minutePart.length === 1 ? `0${minutePart}` : minutePart;
    monthPart = monthPart.length === 1 ? `0${monthPart}` : monthPart;
    datePart = datePart.length === 1 ? `0${datePart}` : datePart;
    // const week = `${yearPart}-${monthPart}-${datePart}\n(${weekPart})`;
    const week = weekPart;
    return {
      date: `${yearPart}-${monthPart}-${datePart}`,
      minutes: `${hourPart}:${minutePart}`,
      hours: hourPart,
      year: yearPart,
      week,
      // stringToWeek: `${time}\n(${weekPart})`,
      stringToWeek: weekPart,
    };
  }

  // 根据传入的时间戳已经当前指标的时间转换标识，返回正确的时间格式
  static getRightFormatTime(time, config) {
    const { intervalConvert } = config;
    const theTime = intervalConvert === 'stringToWeek' ? time : Number(time);
    const allDate = this.transformDate(theTime);
    // 根据当前config.url是否存在判断指标是否是年报数据，由于年报数据没有加intervalConvert标识，所以需要进行单独处理
    if (config.url) {
      const interval = intervalConvert;
      const result = interval ? allDate[`${interval}`] : time;
      return result;
    }
    return allDate.year;
  }

  // 由结合获取的数据及提前写好的配置，按照categories过滤series数据
  static filterSeries(seriesData, config) {
    const { series } = config.table;
    // 根据返回的数据是否具有category2项，而对数据中的category1项进行选择性拼接
    const getCategoryJointed = seriesData.map((item) => {
      const result = item;
      // 如果该组数据具有category2项，则对category1和category2进行拼接
      if (result.category2) {
        result.category1 = `${result.category1}_${result.category2}`;
      }
      return result;
    });
    // 根据配置中提前写好的series项从数据中过滤出需要的数据
    const filteredData = series.map((item) => {
      const result = getCategoryJointed.find(e => e.category1 === item);
      return result;
    });
    // 根据配置中notFilter标识，来判断是否选择过滤后的数据，因为有的数据categories是变化的，希望直接全部展示出来
    const result = config.notFilter ? getCategoryJointed : filteredData;
    const resultRemoveEmpty = result.filter(n => n !== undefined);
    return resultRemoveEmpty;
  }

  // 获取年份列表，seriesData为filteredSeries
  static getYearList(seriesData, config) {
    let yearList;
    let multiYearList = [];
    seriesData.forEach((item) => {
      const singleList = item.data.map(e => e[0]);
      multiYearList = [...multiYearList, ...singleList];
    });
    // 把重复的年份去掉
    const uniqueYearList = [...new Set(multiYearList)];
    const interval = config.intervalConvert || null;
    // 根据表格横纵列转换标识符决定年份排序是倒叙还是正序
    const { transTable } = config;
    const rightSortFunction = transTable ? this.reverseSortFun : this.sortFun;
    if (config.url) {
      // 判断是否有日期转化标识符，如果有就对日期进行格式转换，然后再排序；如果没有，就直接排序，不做转化
      yearList = interval ? uniqueYearList.sort(rightSortFunction).map(item => this.transformDate(item)[`${interval}`])
        : uniqueYearList.sort(rightSortFunction);
    } else {
      yearList = uniqueYearList.map(item => this.transformDate(item).year).sort(rightSortFunction);
    }
    return yearList;
  }

  // 根据得出的年份列表整理数据，seriesData为filteredSeries
  static fillDataByYear(seriesData, yearList, config) {
    // 获取位数配置
    const { decimalPlaces } = config;
    // 对series中的每一项数据的时间进行转换,顺便对数据进行位数处理，保留三位小数
    const timeConvertedSeries = seriesData.map((serie) => {
      let digits;
      const { category1 } = serie;
      if (!decimalPlaces) {
        digits = 0;
      } else if (decimalPlaces) {
        const { all } = decimalPlaces;
        if (all) {
          digits = all;
        } else {
          digits = decimalPlaces[category1] || 0;
        }
      }
      const convertedSerie = {
        ...serie,
        data: serie.data.map(item => [this.getRightFormatTime(item[0], config), this.handleDataPlace(item[1], digits)]),
      };
      return convertedSerie;
    });
    // 对series中的每项serieData按照年份进行整理:没有对应年份项的，添加这一项，值为null
    const filledData = timeConvertedSeries.map((serie) => {
      const data = yearList.map((year) => {
        const theSingleData = serie.data.find(singleData => singleData[0] === year);
        const result = theSingleData || [year, null];
        // const result = theSingleData || [year, '12'];
        return result;
      });
      return {
        ...serie,
        data,
      };
    });
    return filledData;
  }

  /* 给series中数据中的category添加单位,seriesData为filledData；这一步从fillDataByYear中拎出来，是因为chart部分需要使用
  category1没有添加单位的数据
  */
  static addUnitToData(seriesData, config) {
    const handledData = seriesData.map((serie) => {
      const originCategory1 = serie.category1;
      const { unit } = serie;
      const urlCondition = unit ? `${originCategory1}(${unit})` : originCategory1;
      const newCategory1 = config.url ? urlCondition : unit.length > 0 ? `${originCategory1}(${unit})` : originCategory1;
      const result = {
        ...serie,
        category1: newCategory1,
      };
      return result;
    });
    return handledData;
  }

  // 将处理好的数据，整理成table需要的结构,seiresData为加过单位后的seriesData
  static packageTheTable(yearList, seriesData, config) {
    const {
      main, splitByTime, fields, timeNumber, dateRange, dataSource, firstColumnTitle, decimalPlaces,
    } = config.table;
    const tableData = {
      main,
      splitByTime,
      fields,
      timeNumber,
      firstColumnTitle,
      type: 'table',
      dataTimeStart: yearList[yearList.length - 1],
      dataTimeEnd: yearList[0],
      dateRange,
      dataSource: getDataSource(dataSource),
      // 此处去掉结果中的数组结构
      data: [
        {
          categories: yearList,
          series: seriesData.map(serie => ({
            data: serie.data.map(singleData => {
              if(!!decimalPlaces){
                let digits = null;
                const category = serie.category1.split('(')[0];
                const { all } = decimalPlaces;
                if (decimalPlaces.hasOwnProperty('all')) {
                  digits = all;
                  return Number(singleData[1]).toFixed(digits);
                } else if(decimalPlaces.hasOwnProperty(category)) {
                  digits = decimalPlaces[category];
                  return Number(singleData[1]).toFixed(digits)
                } else {
                  return singleData[1];
                }
              }
              return singleData[1];
            }),
            name: serie.category1,
          })),
        },
      ],
    };
    return tableData;
  }

  // 将处理好的数据，整理成chart需要的结构，seriesData为filledSeries
  static packageTheChart(YearList, seriesData, config) {
    // 需求更改，需要表格的年份倒叙排列，但是图表的年份正序排列
    const originYearList = [...YearList];
    // 假如表格中的时间被倒序了，那就正过来，如果没有倒序，就直接使用表格的时间列表
    const yearList = config.transTable ? originYearList.reverse() : originYearList;
    /* 之前直接用的tableData，但是由于tableData中有单位，后续不好做过滤处理，
    因此提前整理出一套数据dataList供chart使用,不过该数据的name部分没加上单位，后续需要单加
    */
    console.log('------------------seriesData-------------------');
    console.log(seriesData);
    const dataList = seriesData.map(serie => ({
      name: serie.category1,
      data: serie.data.map(item => item[1]),
      unit: serie.unit,
    }));
    const { chart, transTable } = config;
    const chartData = chart.map((singleChartConfig) => {
      const {
        main, fields, type, splitByTime, timeNumber, ylabel, chartHidden, firstColumnTitle,
        yAxisFormat, yAxisFormat2, series: seriesConfig, series2: series2Config,
        minY, maxY, minYLeft, minYRight, maxYLeft, maxYRight, tickCount, height,
      } = singleChartConfig;
      const singleChartData = {
        main,
        fields,
        type,
        splitByTime,
        timeNumber,
        firstColumnTitle,
        chartHidden,
        minY,
        maxY,
        minYLeft,
        minYRight,
        maxYLeft,
        maxYRight,
        tickCount,
        height,
        dataTimeStart: yearList[0],
        dataTimeEnd: yearList[yearList.length - 1],
        data: {
          ylabel: ylabel || '',
          yAxisFormat: yAxisFormat || '',
          yAxisFormat2: yAxisFormat2 || '',
          categories: yearList,
          series: seriesConfig.map((serieName) => {
            const theData = dataList.find(item => item.name === serieName);
            // 后续年报数据有变化，返回的年份变多，有些类别在一些年份中直接就不返回了，但是这些类别可能是配置中展示时所必须的，因此判断出现这种情况则返回假数据
            if (theData === undefined) {
              return { name: serieName, data: new Array(dataList[0].data.length).fill(0) };
            }
            if (transTable) {
              theData.data.reverse();
            }
            // 如果表格中有null值，在图表中转为0,顺便有单位的把单位加上
            const { name: originName, unit } = theData;
            const urlCondition = unit ? `${originName}(${unit})` : originName;
            const newName = config.url ? urlCondition : unit.length > 0 ? `${originName}(${unit})` : originName;
            const convertedData = {
              ...theData,
              data: theData.data.map((item) => {
                // const result = item ? Number(item) : 0;
                const result = item ? Number(item) : null;
                return result;
              }),
              name: newName,
            };
            return convertedData;
          }),
          series2: series2Config ? series2Config.map((serieName) => {
            const theData = dataList.find(item => item.name === serieName);
            const { name: originName, unit } = theData;
            const urlCondition = unit ? `${originName}(${unit})` : originName;
            const newName = config.url ? urlCondition : `${originName}(${unit})`;
            if (theData === undefined) {
              return { name: serieName, data: new Array(dataList[0].data.length).fill(0) };
            }
            if (transTable) {
              theData.data.reverse();
            }
            // 如果表格中有null值，在图表中转为0
            const convertedData = {
              ...theData,
              data: theData.data.map((item) => {
                // const result = item ? Number(item) : 0;
                const result = item ? Number(item) : null;
                return result;
              }),
              name: newName,
            };
            return convertedData;
          }) : [],
        },
      };
      const convertedSingleChartData = {
        ...singleChartData,
        data:
        {
          ...singleChartData.data,
          categories: singleChartData.data.series.map(item => item.name),
          series: [{
            name: singleChartConfig.legendName,
            data: singleChartData.data.series.map(item => item.data[0]),
          }],
        },
      };
      return singleChartConfig.legendName ? convertedSingleChartData : singleChartData;
    });
    return chartData;
  }
}
class multiCategoryUtils {
  // 处理数据小数位数
  static handleDataPlace(data, digits) {
    const result = {
      ...data,
      data: data.data.map((item) => {
        const res = {
          ...item,
          data: item.data.map((singleData) => {
            if (typeof singleData[1] === 'number') {
              return [singleData[0], singleData[1].toFixed(digits)];
            }
            return singleData;
          }),
        };
        return res;
      }),
    };
    return result;
  }
  // 将原始数据按照series分成不同的组
  static divideDataToGroups(originData, config) {
    const data = originData.series;
    const { series2 } = config.table;
    const { decimalPlaces } = config;
    // 按照series2项对数据进行分组
    const groupedData = series2.map((serie2Name) => {
      const filteredData = data.filter(serie => serie.category2 === serie2Name);
      return {
        name: serie2Name,
        data: filteredData,
      };
    });
    // 过滤掉空数据的情况
    const filterEmpty = groupedData.filter(item => item.data.length > 0);
    // 处理数据位数
    const result = filterEmpty.map((item) => {
      const { name } = item;
      let digits;
      if (!decimalPlaces) {
        digits = 0;
      } else if (decimalPlaces) {
        const { all } = decimalPlaces;
        if (all) {
          digits = all;
        } else {
          digits = decimalPlaces[name] || 0;
        }
      }
      return this.handleDataPlace(item, digits);
    });
    // return filterEmpty;
    return result;
  }

  static getCategoryList(originData, config) {
    const { series } = config.table;
    const category1List = originData.series.map(item => item.category1);
    const distinctCategory1List = [...new Set(category1List)];
    // 根据配置中的notFilter标识，来决定使用后台返回的category1还是配置中的series
    const result = config.notFilter ? distinctCategory1List : series;
    return result;
  }

  static sortDataBySeries(dividedData, serieList) {
    const sortedData = dividedData.map((group) => {
      // 此处这个unit获取有个问题，目前是随便选了一个category1所对应的单位，但是不同的category1的单位有可能
      // 是不一样的；有个矛盾的点是，即便是不一样的，单位也不能加在category1上，只能加在category2上，
      // 这是因为从一个category1对应的不同category2的单位有可能是不一样的
      const { unit } = group.data[0];
      return {
        name: group.name,
        data: serieList.map((serieName) => {
          const singleData = group.data.find(item => item.category1 === serieName);
          if (singleData && singleData.data.length > 0) {
            /* 如果数据存在，就选取时间最新的数据；此处这么选是因为虽然接收到的数据是按照时间(年份)来
            排列的，但是由于目前的展示需求只展示一年的数据，后续渲染预处理函数选取的年份也是最新一年的，
            因此干脆在此处取数时，就取最新事件的数据；
            */
            const { length } = singleData.data;
            const theData = singleData.data[length - 1][1];
            return theData;
          }
          return null;
        }),
        unit,
      };
    });
    return sortedData;
  }

  static addUnitToData(sortedData, config) {
    const handledData = sortedData.map((item) => {
      const { name, data, unit } = item;
      const urlCondition = unit ? `${name}(${unit})` : name;
      const newName = config.url ? urlCondition : unit ? `${name}(${unit})` : name;
      const {decimalPlaces} = config.table;
      return {
        name: newName,
        data,
      };
    });
    return handledData;
  }

  static packageTheTable(unitedData, seriesList, config) {
    const {
      fields, splitByTime, main, timeNumber, dateRange, dataSource, firstColumnTitle, decimalPlaces,
    } = config.table;
    // 对数据进行处理，存在null值则转换为0，且将所有字符串数值转为数字
    let unitedFixedData;
    if(!!decimalPlaces){
      unitedFixedData = unitedData.map(serie => {
        let digits = null;
        const category = serie.name.split('(')[0];
        const { all } = decimalPlaces;
        if (decimalPlaces.hasOwnProperty('all')) {
          digits = all;
          return {
            name: serie.name,
            data: serie.data.map(item => Number(item).toFixed(digits))
          }
        } else if(decimalPlaces.hasOwnProperty(category)){
          digits = decimalPlaces[category];
          return {
            name: serie.name,
            data: serie.data.map(item => Number(item).toFixed(digits))
          }
        } else {
          return {
            name: serie.name,
            data: serie.data,
          }
        }
      })
    }
    const tableData = {
      main,
      type: 'table',
      splitByTime,
      fields,
      timeNumber,
      firstColumnTitle,
      dataTimeStart: '',
      dataTimeEnd: '',
      dateRange,
      dataSource: getDataSource(dataSource),
      // 此处可去掉括号
      data: [{
        categories: seriesList,
        series: decimalPlaces ? unitedFixedData : unitedData,
      },
      ],
    };
    return tableData;
  }

  static packageTheChart(dividedData, sortedData, seriesList, config) {
    const chartData = config.chart.map((chartConfig) => {
      const {
        main, fields, type, splitByTime, chartHidden,
        series: seriesConfig, series2: series2Config,
        minY, maxY, minYLeft, minYRight, maxYLeft, maxYRight, tickCount, height,
      } = chartConfig;
      /* 由于chart的series和table的可能不太一样，因此要判断一下，没有notFilter标识符的情况下，根据series排序
      这步，要使用chart自己的series
      */
      const finalSeriesList = config.notFilter ? seriesList : seriesConfig;
      const finalSortedData = config.notFilter
        ? sortedData : this.sortDataBySeries(dividedData, seriesConfig);
      const mapedSeriesData = series2Config.map((series2Name) => {
        const result = finalSortedData.find(item => item.name === series2Name);
        return result || null;
      });
      const filteredData = mapedSeriesData.filter(item => item !== null);
      // 对数据进行处理，存在null值则转换为0，且将所有字符串数值转为数字
      const convertedFileredData = filteredData.map((item) => {
        const result = {
          ...item,
          data: item.data.map((singleData) => {
            // const finalData = singleData ? Number(singleData) : 0;
            const finalData = singleData ? Number(singleData) : null;
            return finalData;
          }),
        };
        return result;
      });
      const unitAddedData = this.addUnitToData(convertedFileredData, config);
      const singleChartData = {
        main,
        fields,
        type,
        splitByTime,
        chartHidden,
        minY,
        maxY,
        minYLeft,
        minYRight,
        maxYLeft,
        maxYRight,
        tickCount,
        height,
        data: {
          categories: finalSeriesList,
          series: unitAddedData,
        },
      };
      const singlePieChartData = {
        main,
        fields,
        type,
        splitByTime,
        chartHidden,
        data:
        {
          series: finalSeriesList.map((serie, index) => {
            // 此处选择第一个，是因为画饼图的话，series2只能有一个
            const theData = convertedFileredData[0];
            const { data } = theData;
            // const newName = unit ? `${serie}(${unit})` : serie;
            const newName = serie;
            const singleData = data[index];
            return {
              name: newName,
              data: singleData,
            };
          }),
        },
      };
      return type === 'pie' ? singlePieChartData : singleChartData;
    });
    return chartData;
  }
  /*
此版改动较大，主要是在对时间（年份）的处理方面；之前版本在处理splitByTime为true的情况时，最后会将数据按照时间
来划分，按顺序排列出来，这也是出版处理后的数据结构中data之所以要套一个数组的原因；但是后来发现遇到spliteByTime为
true的情况时，年报数据一般只会请求一年的，也就是说展示方面只展示一年，非年报数据，则展示最新时间的数据，
这样的话，根本就没必要在去按照时间去排序了。
不过这样会有个问题，就是timepicker在用户初次进入指标时，时间的展示是从处理过后的数据中提取的（dataTimeStart，dataTimeEnd）
,现在不按年份来排列的话，数据中就不存在dataTimeSart和dataTimeEnd的数据了；因此timepicker部分要做修改，
最好的办法是直接从配置中获取初始时间，因为初始时间都是写好在配置里了，直接用就可以了
*/
}
// 表格数据处理，包括：转换表格纵横列、填充部分 series、计算第一列文本高度
// 传入参数：fullYearChartData
const processTableData = (
  fullYearChartData, config, tableWidth, heightRate,
) => fullYearChartData.map((itemYearData) => {
  if (itemYearData.type !== 'table') {
    return itemYearData;
  }
  const target = itemYearData.data[0];
  const newTableSeries = target.categories.map((category, cateIndex) => ({
    name: category,
    data: target.series.map(seriesItem => seriesItem.data[cateIndex]),
    width: config.width || tableWidth,
  }));
  const transTable = {
    ...itemYearData,
    data: {
      ...target,
      series: newTableSeries,
      categories: target.series.map(seriesItem => ({
        value: seriesItem.name,
        heightNumber: Math.ceil(getStringLength(seriesItem.name) / heightRate),
      })),
    },
  };
  const noTransTable = {
    ...itemYearData,
    data: {
      ...target,
      series: target.series.map(seriesItem => ({
        ...seriesItem,
        width: config.width || tableWidth,
      })),
      categories: target.categories.map(category => (category.heightNumber ? category : {
        value: category,
        // heightNumber: 当前文本需要显示的行数
        heightNumber: Math.ceil(getStringLength(category) / heightRate),
      })),
    },
  };
  return config.transTable ? transTable : noTransTable;
});
const TransformData = (config, data, tableWidth = 120, heightRate = 14) => {
  const { splitByTime } = config.table;
  let handledData;
  if (splitByTime) {
    const dividedData = multiCategoryUtils.divideDataToGroups(data, config);
    const seriesList = multiCategoryUtils.getCategoryList(data, config);
    const sortedData = multiCategoryUtils.sortDataBySeries(dividedData, seriesList, config);
    const unitedData = multiCategoryUtils.addUnitToData(sortedData, config);
    const tableData = multiCategoryUtils.packageTheTable(unitedData, seriesList, config);
    const chartData = multiCategoryUtils.packageTheChart(dividedData, sortedData, seriesList, config);
    handledData = [tableData, ...chartData];
  } else {
    const filteredData = singleCategoryUntils.filterSeries(data.series, config);
    const yearList = singleCategoryUntils.getYearList(filteredData, config);
    const filledData = singleCategoryUntils.fillDataByYear(filteredData, yearList, config);
    const unitAddedData = singleCategoryUntils.addUnitToData(filledData, config);
    const tableData = singleCategoryUntils.packageTheTable(yearList, unitAddedData, config);
    const chartData = singleCategoryUntils.packageTheChart(yearList, filledData, config);
    handledData = [tableData, ...chartData];
  }
  const result = processTableData(handledData, config, tableWidth, heightRate);
  return result;
};

// export default TransformData;
export { TransformData, singleCategoryUntils, multiCategoryUtils, processTableData };

