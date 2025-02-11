import { Avatar, Input, Table } from 'antd';
import { useEffect, useState } from 'react';
import axiosInstance from '../../api/axiosConfig';

const { Search } = Input;

export const TableUser = ({ setUserVerify }) => {
  const [data, setData] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchUsers();
  }, [page, pageSize, searchTerm]);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const response = await axiosInstance.get(`api/user/users`, {
        params: { page, pageSize, search: searchTerm, filterVerified: true },
      });
      setData(response.data.users);
      setTotal(response.data.total);
    } catch (error) {
      console.error('Lỗi khi lấy danh sách user:', error);
    } finally {
      setLoading(false);
    }
  };

  const columns = [
    {
      title: 'Avatar',
      dataIndex: 'avatar',
      key: 'avatar',
      render: (avatar: string) => <Avatar src={avatar} />,
    },
    {
      title: 'Tên User',
      dataIndex: 'name',
      key: 'name',
      sorter: (a: any, b: any) => a.name.localeCompare(b.name),
    },
    {
      title: 'Email',
      dataIndex: 'email',
      key: 'email',
    },
    {
      title: 'Số Điện Thoại',
      dataIndex: 'phone',
      key: 'phone',
    },
    {
      title: 'Địa Chỉ',
      dataIndex: 'address',
      key: 'address',
    },
    {
      title: 'Giới Tính',
      dataIndex: 'gender',
      key: 'gender',
      filters: [
        { text: 'Nam', value: 'Male' },
        { text: 'Nữ', value: 'Female' },
      ],
      onFilter: (value: string, record: any) => record.gender === value,
    },
    {
      title: 'Ngày Sinh',
      dataIndex: 'dob',
      key: 'dob',
      render: (dob: string) => new Date(dob).toLocaleDateString(),
    },
    {
      title: 'Loại Tài Khoản',
      dataIndex: 'role',
      key: 'role',
      filters: [
        { text: 'Người Dùng', value: 'user' },
        { text: 'Quản Lý', value: 'admin' },
      ],
      onFilter: (value: string, record: any) => record.role === value,
      render: (role: string) => (role === 'admin' ? 'Quản Lý' : 'Người Dùng'),
    },
  ];
  return (
    <div className="flex flex-col w-full h-full gap-[18px]">
      <Search
        placeholder="Tìm kiếm theo tên..."
        allowClear
        onSearch={(value) => setSearchTerm(value)}
        style={{ width: '100%' }}
      />

      {/* 🔹 Hiển thị bảng user */}
      <Table
        rowSelection={{
          type: 'radio',
          onChange: (selectedRowKeys: React.Key[], selectedRows) => {
            console.log(selectedRowKeys, selectedRows);
            setUserVerify(selectedRowKeys[0]);
          },
        }}
        columns={columns}
        dataSource={data}
        loading={loading}
        rowKey="id"
        pagination={{
          current: page,
          pageSize: pageSize,
          total: total,
          showSizeChanger: true,
          onChange: (page, pageSize) => {
            setPage(page);
            setPageSize(pageSize);
          },
        }}
        scroll={{ y: 55 * 8 }}
      />
    </div>
  );
};
