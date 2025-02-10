import { useEffect, useState } from 'react';
import { Bar, Line } from 'react-chartjs-2';
import {
  Chart,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  PointElement,
  LineElement,
} from 'chart.js';
import axiosInstance from '../../api/axiosConfig';
import { Button } from 'antd';

// ✅ Đăng ký các thành phần Chart.js
Chart.register(
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  Title,
  Tooltip,
  Legend
);

const StatsChart = () => {
  const [chartData, setChartData] = useState<{
    labels: string[];
    datasets: any[];
  }>({
    labels: ['aaaa'],
    datasets: [
      {
        label: `Số file ký theo `,
        data: [3],
        backgroundColor: 'rgba(54, 162, 235, 0.6)',
        borderColor: 'rgba(54, 162, 235, 1)',
        borderWidth: 1,
      },
    ],
  });

  const [type, setType] = useState<'week' | 'month'>('week');
  const [chartType, setChartType] = useState<'bar' | 'horizontalBar' | 'line'>(
    'bar'
  );

  //   useEffect(() => {
  //     fetchStats();
  //   }, [type]);

  const fetchStats = async () => {
    try {
      const response = await axiosInstance.get(`/api/stats/files?type=${type}`);
      const data = response.data;

      // Chuyển đổi dữ liệu cho Chart.js
      const labels = data.map((item: { period: string | number | Date }) =>
        new Date(item.period).toLocaleDateString()
      );
      const values = data.map(
        (item: { total_files: unknown }) => item.total_files
      );

      setChartData({
        labels,
        datasets: [
          {
            label: `Số file ký theo ${type === 'week' ? 'tuần' : 'tháng'}`,
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

  return (
    <div className="w-full max-w-full min-w-full">
      <div className="flex justify-between items-start space-x-4 my-4 gap-[10px]">
        <div className="text-[18px]">Thống kê file đã ký theo Tuần/Tháng</div>
        <div className="flex  gap-[10px]">
          <Button
            type={type === 'week' ? 'primary' : 'default'}
            onClick={() => setType('week')}
          >
            Theo Tuần
          </Button>
          <Button
            type={type === 'month' ? 'primary' : 'default'}
            onClick={() => setType('month')}
          >
            Theo Tháng
          </Button>
        </div>
      </div>

      {/* 🔹 Hiển thị Biểu Đồ */}
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
