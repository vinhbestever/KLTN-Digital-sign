import { EditFilled } from '@ant-design/icons';
import axiosInstance from '../../api/axiosConfig';
import { useEffect, useState } from 'react';
import StatsChart from './StatsChart';
import TableSign from './TableSign';
import { useUser } from '../../context/UserContext';

export const Dashboard = () => {
  const [totalSignatures, setTotalSignatures] = useState(0);
  const { user } = useUser();

  useEffect(() => {
    if (user) {
      fetchTotalSignatures();
    }
  }, [user]);

  const fetchTotalSignatures = async () => {
    try {
      const response = await axiosInstance.get(
        `api/files/total-signatures${user?.role === 'admin' ? '-all' : ''}`
      );
      setTotalSignatures(response.data.total);
    } catch (error) {
      console.error('Lỗi khi lấy tổng số lượt ký:', error);
    }
  };

  return (
    <div className="p-[32px] flex flex-col w-full h-full gap-[18px] overflow-auto">
      <div className="text-[22px] font-medium">Thống kê</div>
      <div className="w-full flex flex-col items-center gap-[20px]">
        <div className="w-full flex items-center gap-[20px]">
          <div className="w-1/2 bg-white rounded-lg shadow-lg flex flex-col p-[20px] gap-[18px]">
            <div className="flex items-center justify-center bg-purple-200 w-fit h-fit p-[10px] rounded-lg">
              <EditFilled style={{ fontSize: 42, color: '#573b8a' }} />
            </div>
            <div className="text-[18px] font-semibold">
              {totalSignatures} lượt ký
            </div>
            <div className="text-gray-500">Tổng lượt ký số</div>
          </div>
          <div className="w-1/2"></div>
        </div>

        <div className="w-full flex items-center gap-[20px]">
          <div className="w-1/2 bg-white rounded-lg shadow-lg flex flex-col p-[20px] gap-[18px]">
            <StatsChart />
          </div>

          <div className="w-1/2 h-[410px] bg-white rounded-lg shadow-lg flex flex-col p-[20px] gap-[18px]">
            <TableSign />
          </div>
        </div>
      </div>
    </div>
  );
};
