import { Button, Select, DatePicker } from 'antd';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { Bar, Line } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  Title,
  Tooltip,
  Legend
);

import { useEffect, useState } from 'react';
import axiosInstance from '../../api/axiosConfig';
import dayjs from 'dayjs';
import isoWeek from 'dayjs/plugin/isoWeek';

dayjs.extend(isoWeek);

const { RangePicker } = DatePicker;

const StatsChart = () => {
  const [chartData, setChartData] = useState({ labels: [], datasets: [] });
  const [chartType, setChartType] = useState('bar');
  const [rangeType, setRangeType] = useState('today');
  const [customRange, setCustomRange] = useState([]);

  useEffect(() => {
    fetchStats();
  }, [rangeType, customRange]);

  const fetchStats = async () => {
    try {
      const { startDate, endDate } = getDateRange(rangeType);
      const response = await axiosInstance.get(`api/files/statics`, {
        params: { startDate, endDate, rangeType },
      });

      const data = response.data;

      let labels = [];
      let values = [];

      if (['today', 'yesterday', 'custom'].includes(rangeType)) {
        labels = [
          `${dayjs(startDate).format('DD/MM/YYYY')} - ${dayjs(endDate).format(
            'DD/MM/YYYY'
          )}`,
        ];
        values = [data.length > 0 ? data[0].total_files : 0];
      } else if (rangeType === 'last7days') {
        labels = Array.from({ length: 7 }, (_, i) =>
          dayjs()
            .subtract(6 - i, 'day')
            .format('DD/MM')
        );
        values = labels.map((label) => {
          const found = data.find(
            (item) => dayjs(item.period).format('DD/MM') === label
          );
          return found ? found.total_files : 0;
        });
      } else if (['thisMonth', 'lastMonth'].includes(rangeType)) {
        labels = data.map((item) => `${item.period.split('-')[1]}`);

        values = data.map((item) => item.total_files);
      } else if (rangeType === 'thisYear') {
        labels = data.map((item) => `Tháng ${item.period.split('-')[1]}`);
        values = data.map((item) => item.total_files);
      } else if (rangeType === 'custom' && customRange.length === 2) {
        labels = [
          `${dayjs(customRange[0]).format('DD/MM/YYYY')} - ${dayjs(
            customRange[1]
          ).format('DD/MM/YYYY')}`,
        ];
        values = [data.reduce((sum, item) => sum + item.total_files, 0)];
      }

      setChartData({
        labels,
        datasets: [
          {
            label: `Số file ký theo ${formatRangeType(rangeType)}`,
            data: values,
            backgroundColor: 'rgba(54, 162, 235, 0.6)',
            borderColor: 'rgba(54, 162, 235, 1)',
            borderWidth: 1,
          },
        ],
      });
    } catch (error) {
      console.error('Lỗi khi lấy thống kê:', error);
    }
  };

  const getDateRange = (type) => {
    const today = dayjs().startOf('day').format('YYYY-MM-DD 00:00:00');
    const ranges = {
      today: {
        startDate: today,
        endDate: dayjs().endOf('day').format('YYYY-MM-DD 23:59:59'),
      },
      yesterday: {
        startDate: dayjs()
          .subtract(1, 'day')
          .startOf('day')
          .format('YYYY-MM-DD 00:00:00'),
        endDate: dayjs()
          .subtract(1, 'day')
          .endOf('day')
          .format('YYYY-MM-DD 23:59:59'),
      },
      last7days: {
        startDate: dayjs()
          .subtract(6, 'day')
          .startOf('day')
          .format('YYYY-MM-DD 00:00:00'),
        endDate: dayjs().endOf('day').format('YYYY-MM-DD 23:59:59'),
      },
      thisMonth: {
        startDate: dayjs().startOf('month').format('YYYY-MM-DD 00:00:00'),
        endDate: dayjs().endOf('day').format('YYYY-MM-DD 23:59:59'),
      },
      lastMonth: {
        startDate: dayjs()
          .subtract(1, 'month')
          .startOf('month')
          .format('YYYY-MM-DD 00:00:00'),
        endDate: dayjs()
          .subtract(1, 'month')
          .endOf('month')
          .format('YYYY-MM-DD 23:59:59'),
      },
      thisYear: {
        startDate: dayjs().startOf('year').format('YYYY-MM-DD 00:00:00'),
        endDate: dayjs().endOf('day').format('YYYY-MM-DD 23:59:59'),
      },
      custom: {
        startDate:
          customRange.length === 2
            ? customRange[0].format('YYYY-MM-DD HH:mm:ss')
            : today,
        endDate:
          customRange.length === 2
            ? customRange[1].format('YYYY-MM-DD HH:mm:ss')
            : today,
      },
    };
    return ranges[type] || { startDate: today, endDate: today };
  };

  const formatRangeType = (rangeType) => {
    switch (rangeType) {
      case 'today':
        return 'Hôm nay';
      case 'yesterday':
        return 'Hôm qua';
      case 'last7days':
        return '7 ngày trước';
      case 'thisMonth':
        return 'Tháng này';
      case 'lastMonth':
        return 'Tháng trước';
      case 'thisYear':
        return 'Năm nay';
      case 'custom':
        return 'Tùy chỉnh';
      default:
        return 'Thống kê';
    }
  };

  return (
    <div className="w-full">
      <div className="flex justify-between items-start gap-[10px]">
        <div className="text-[18px]">Thống kê file đã ký</div>
        <div className="flex gap-[10px]">
          <Select
            value={rangeType}
            onChange={setRangeType}
            style={{ width: 200 }}
          >
            <Select.Option value="today">Hôm nay</Select.Option>
            <Select.Option value="yesterday">Hôm qua</Select.Option>
            <Select.Option value="last7days">7 ngày trước</Select.Option>
            <Select.Option value="thisMonth">Tháng này</Select.Option>
            <Select.Option value="lastMonth">Tháng trước</Select.Option>
            <Select.Option value="thisYear">Năm nay</Select.Option>
            <Select.Option value="custom">Tùy chỉnh</Select.Option>
          </Select>
          {rangeType === 'custom' && (
            <RangePicker onChange={(dates) => setCustomRange(dates || [])} />
          )}
        </div>
      </div>

      {chartType === 'bar' && (
        <Bar
          data={chartData}
          options={{ responsive: true, plugins: { legend: { display: true } } }}
        />
      )}
      {chartType === 'horizontalBar' && (
        <Bar
          data={chartData}
          options={{
            responsive: true,
            indexAxis: 'y', // ✅ Cấu hình để hiển thị dạng Cột Ngang
            plugins: { legend: { display: true } },
          }}
        />
      )}
      {chartType === 'line' && (
        <Line
          data={chartData}
          options={{ responsive: true, plugins: { legend: { display: true } } }}
        />
      )}

      <div className="flex justify-center space-x-4 my-4 gap-[10px]">
        <Button
          type={chartType === 'bar' ? 'primary' : 'default'}
          onClick={() => setChartType('bar')}
        >
          Cột Dọc
        </Button>
        <Button
          type={chartType === 'horizontalBar' ? 'primary' : 'default'}
          onClick={() => setChartType('horizontalBar')}
        >
          Cột Ngang
        </Button>
        <Button
          type={chartType === 'line' ? 'primary' : 'default'}
          onClick={() => setChartType('line')}
        >
          Đường
        </Button>
      </div>
    </div>
  );
};

export default StatsChart;
