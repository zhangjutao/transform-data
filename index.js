import { singleCategoryUntils, multiCategoryUtils, processTableData } from './oldMethod';

const transformForF2 = (config, data, tableWidth = 120, heightRate = 14) => {
  const { splitByTime } = config.table;
  let handledData;
  if (splitByTime) {
    const dividedData = multiCategoryUtils.divideDataToGroups(data, config);
    const seriesList = multiCategoryUtils.getCategoryList(data, config);
    const sortedData = multiCategoryUtils.sortDataBySeries(dividedData, seriesList, config);
    const unitedData = multiCategoryUtils.addUnitToData(sortedData, config);
    const tableData = multiCategoryUtils.packageTheTable(unitedData, seriesList, config);
    const chartData = multiCategoryUtils
    .packageTheChart(dividedData, sortedData, seriesList, config);
    const newChartData = chartData.map((item, index) => {
      let result = [];
      const { categories, series, series2 } = item.data;
      const { type: chartType } = config.chart[index];
      let newData;
      if (chartType === 'column-line') {
        // const name1 = series[0].name;
        // const name2 = series2[0].name;
        newData = categories.map((category, index1) => ({
          category: category.toString(),
          data1: series[0].data[index1],
          data2: series2[0].data[index1],
          // [name1]: series[0].data[index1],
          // [name2]: series2[0].data[index1],
        }));
        result = newData;
      } else if (chartType === 'pie') {
        result = series.map(serie => ({
          ...serie,
          constant: '1',
        }));
      } else {
        newData = series.map((serie) => {
          const { name, data: serieData } = serie;
          const newSerieData = categories.map((category, index2) => ({
            category: category.toString(),
            name,
            data: serieData[index2],
          }));
          return newSerieData;
        });
        newData.forEach((singleData) => {
          result = [...result, ...singleData];
        });
      }
      // newData.forEach((singleData) => {
      //   result = [...result, ...singleData];
      // });
      return {
        ...item,
        // data: newData,
        data: result,
      };
    });
    handledData = [tableData, ...newChartData];
  } else {
    const filteredData = singleCategoryUntils.filterSeries(data.series, config);
    const yearList = singleCategoryUntils.getYearList(filteredData, config);
    const filledData = singleCategoryUntils.fillDataByYear(filteredData, yearList, config);
    const unitAddedData = singleCategoryUntils.addUnitToData(filledData, config);
    const tableData = singleCategoryUntils.packageTheTable(yearList, unitAddedData, config);
    const chartData = singleCategoryUntils.packageTheChart(yearList, filledData, config);
    const newChartData = chartData.map((item, index) => {
      let result = [];
      const { categories, series, series2 } = item.data;
      const { type: chartType } = config.chart[index];
      let newData;
      if (chartType === 'column-line') {
        // const name1 = series[0].name;
        // const name2 = series2[0].name;
        newData = categories.map((category, index1) => ({
          category: category.toString(),
          data1: series[0].data[index1],
          data2: series2[0].data[index1],
          // [name1]: series[0].data[index1],
          // [name2]: series2[0].data[index1],
        }));
        result = newData;
      } else {
        newData = series.map((serie) => {
          const { name, data: serieData } = serie;
          const newSerieData = categories.map((category, index2) => ({
            category: category.toString(),
            name,
            data: serieData[index2],
          }));
          return newSerieData;
        });
        newData.forEach((singleData) => {
          result = [...result, ...singleData];
        });
      }
      // newData.forEach((singleData) => {
      //   result = [...result, ...singleData];
      // });
      return {
        ...item,
        // data: newData,
        data: result,
      };
    });
    handledData = [tableData, ...newChartData];
  }
  const result = processTableData(handledData, config, tableWidth, heightRate);
  return result;
};
// jk
export default transformForF2;
