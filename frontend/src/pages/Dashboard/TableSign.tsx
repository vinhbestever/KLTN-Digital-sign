import { Table } from 'antd';
import { useEffect, useState } from 'react';
import axiosInstance from '../../api/axiosConfig';
import { useUser } from '../../context/UserContext';

const TableSign = () => {
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(false);

  const { user } = useUser();

  useEffect(() => {
    if (user) {
      fetchRecentSignedFiles();
    }
  }, [user]);

  const fetchRecentSignedFiles = async () => {
    setLoading(true);
    try {
      const response = await axiosInstance.get(
        `/api/files/recent-files${user?.role === 'admin' ? '-all' : ''}`
      );
      setFiles(response.data.files);
    } catch (error) {
      console.error('Lỗi khi lấy file gần đây:', error);
    } finally {
      setLoading(false);
    }
  };

  const columns = [
    {
      title: 'Số thứ tự',
      dataIndex: 'index',
      key: 'index',
      render: (_, __, index) => index + 1,
    },
    {
      title: 'File Ký',
      dataIndex: 'file_name',
      key: 'file_name',
    },
    {
      title: 'Ngày Ký',
      dataIndex: 'signed_at',
      key: 'signed_at',
      render: (signed_at) => new Date(signed_at).toLocaleDateString(),
    },
  ];

  return (
    <div className="w-full">
      <div className="flex flex-col w-full justify-between items-start gap-[10px] overflow-y-auto">
        <div className="text-[18px]">
          Danh sách file đã ký trong 7 ngày gần nhất
        </div>

        <Table
          style={{ width: '100%' }}
          columns={columns}
          pagination={false}
          dataSource={files}
          loading={loading}
          rowKey="id"
        />
      </div>
    </div>
  );
};

export default TableSign;
