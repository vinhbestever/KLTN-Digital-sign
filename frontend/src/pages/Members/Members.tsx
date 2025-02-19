import {
  Avatar,
  Button,
  DatePicker,
  Form,
  Input,
  message,
  Modal,
  Select,
  Space,
  Table,
  Tag,
} from 'antd';
import { useEffect, useState } from 'react';
import axiosInstance from '../../api/axiosConfig';
import dayjs from 'dayjs';
import { PlusOutlined, UserOutlined } from '@ant-design/icons';

const { Search } = Input;
const { Option } = Select;

const checkCertificateStatus = (certExpiresAt: string) => {
  return dayjs(certExpiresAt).isBefore(dayjs()) ? 'Hết hạn' : 'Còn hạn';
};

export const Members = () => {
  const [data, setData] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [searchTerm, setSearchTerm] = useState('');

  const [form] = Form.useForm();
  const [form2] = Form.useForm();
  const [form3] = Form.useForm();
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [isModalCreateVisible, setIsModalCreateVisible] = useState(false);
  const [isModalRenew, setIsModalRenew] = useState(false);

  const [currentUser, setCurrentUser] = useState(null);

  useEffect(() => {
    fetchUsers();
  }, [page, pageSize, searchTerm]);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const response = await axiosInstance.get(`api/user/users`, {
        params: { page, pageSize, search: searchTerm },
      });
      setData(response.data.users);
      setTotal(response.data.total);
    } catch (error) {
      console.error('Lỗi khi lấy danh sách user:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (record) => {
    setCurrentUser(record);
    form.setFieldsValue({
      ...record,
      dob: record.dob ? dayjs(record.dob) : null, // 🔹 Chuyển đổi từ string sang dayjs
    });
    setIsModalVisible(true);
  };

  const handleDelete = async (id) => {
    Modal.warning({
      title: 'Có chắc muốn xoá tài khoản này',
      async onOk() {
        try {
          await axiosInstance.delete(`api/user/users/${id}`);
          message.success('Xóa user thành công!');
          fetchUsers();
        } catch (error) {
          message.error('Lỗi khi xóa user!');
        }
      },
    });
  };

  const handleRenew = (record) => {
    setCurrentUser(record);
    form3.setFieldsValue({
      ...record,
      dob: record.dob ? dayjs(record.dob) : null, // 🔹 Chuyển đổi từ string sang dayjs
    });
    setIsModalRenew(true);
  };

  const handleSubmit = async (values) => {
    try {
      await axiosInstance.put(`api/user/users/${currentUser.id}`, values);
      message.success('Cập nhật user thành công!');
      fetchUsers();
      setIsModalVisible(false);
      form.resetFields();
    } catch (error) {
      message.error('Lỗi khi cập nhật user!');
    }
  };

  const handleSubmitCreate = async (values) => {
    try {
      await axiosInstance.post(`api/auth/create-account`, values);
      message.success('Tạo tài khoản thành công!');
      fetchUsers();
      setIsModalCreateVisible(false);
      form.resetFields();
    } catch (error) {
      message.error('Lỗi tạo tài khoản!');
    }
  };

  const handleSubmitRenew = async (values) => {
    try {
      await axiosInstance.post(
        `api/auth/renew-cert/${currentUser.id}/${values.type}`
      );
      message.success('Tạo tài khoản thành công!');
      fetchUsers();
      setIsModalRenew(false);
      form.resetFields();
    } catch (error) {
      message.error('Lỗi tạo tài khoản!');
    }
  };

  const columns = [
    {
      title: 'Avatar',
      dataIndex: 'avatar',
      key: 'avatar',
      render: (avatar: string) => (
        <Avatar src={avatar} icon={<UserOutlined />} />
      ),
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
    {
      title: 'Xác Thực',
      dataIndex: 'is_verified',
      key: 'is_verified',
      render: (is_verified: boolean) => (
        <Tag color={is_verified ? 'green' : 'red'}>
          {is_verified ? 'Đã Xác Thực' : 'Chưa Xác Thực'}
        </Tag>
      ),
    },
    {
      title: 'Loại Chứng Chỉ',
      dataIndex: 'algorithm',
      key: 'algorithm',
      render: (type: string) =>
        type === 'RSA' ? 'RSA (4096-bit)' : 'ECC (256-bit)',
    },
    {
      title: 'Ngày hết hạn chứng chỉ',
      dataIndex: 'cert_expires_at',
      key: 'cert_expires_at',
      render: (date: string) => dayjs(date).format('DD/MM/YYYY HH:mm:ss'),
    },
    {
      title: 'Trạng thái chứng chỉ',
      dataIndex: 'cert_expires_at',
      key: 'cert_status',
      render: (date: string) => {
        const status = checkCertificateStatus(date);
        return (
          <span style={{ color: status === 'Hết hạn' ? 'red' : 'green' }}>
            {status}
          </span>
        );
      },
    },
    {
      title: 'Cấp chứng chỉ',
      key: 'action',
      render: (record) => (
        <Button type="primary" onClick={() => handleRenew(record)}>
          Cấp lại
        </Button>
      ),
    },
    {
      title: 'Hành động',
      key: 'action',
      render: (record) => (
        <Space>
          <Button onClick={() => handleEdit(record)}>Sửa</Button>
          <Button danger onClick={() => handleDelete(record.id)}>
            Xóa
          </Button>
        </Space>
      ),
    },
  ];

  return (
    <div className="p-[32px] flex flex-col w-full h-full gap-[18px]">
      <div className="text-[22px] font-medium">Quản lý thành viên</div>
      <div className="w-full h-full bg-white rounded-lg shadow-lg flex flex-col items-center p-[20px] overflow-auto gap-[18px]">
        <div className="w-full flex items-center gap-[10px] justify-between">
          <div className="text-[16px]">Danh sách thành viên</div>
          <Button
            onClick={() => setIsModalCreateVisible(true)}
            icon={<PlusOutlined />}
            type="primary"
          >
            Thêm người dùng mới
          </Button>
        </div>

        <div className="flex flex-col w-full h-full gap-[18px]">
          <Search
            placeholder="Tìm kiếm theo tên..."
            allowClear
            onSearch={(value) => setSearchTerm(value)}
            style={{ width: '100%' }}
          />

          {/* 🔹 Hiển thị bảng user */}
          <Table
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
      </div>
      <Modal
        open={isModalRenew}
        title="Cấp mới chứng chỉ số"
        onCancel={() => setIsModalRenew(false)}
        footer={
          <div className="flex items-center w-full justify-end gap-[12px]">
            <Button onClick={() => setIsModalRenew(false)}>Huỷ</Button>
            <Button type="primary" onClick={() => form3.submit()}>
              Lưu
            </Button>
          </div>
        }
      >
        <Form form={form3} layout="vertical" onFinish={handleSubmitRenew}>
          <Form.Item
            name="type"
            label="Loại hệ mật"
            rules={[{ required: true }]}
          >
            <Select>
              <Option value="ECC">ECC (256-bit)</Option>
              <Option value="RSA">RSA (4096-bit)</Option>
            </Select>
          </Form.Item>
        </Form>
      </Modal>
      <Modal
        open={isModalCreateVisible}
        title="Chỉnh sửa Thông tin tài khoản"
        onCancel={() => setIsModalCreateVisible(false)}
        footer={
          <div className="flex items-center w-full justify-end gap-[12px]">
            <Button onClick={() => setIsModalCreateVisible(false)}>Huỷ</Button>
            <Button type="primary" onClick={() => form2.submit()}>
              Lưu
            </Button>
          </div>
        }
      >
        <Form form={form2} layout="vertical" onFinish={handleSubmitCreate}>
          <Form.Item name="name" label="Họ và tên" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item name="email" label="Email" rules={[{ required: true }]}>
            <Input type="email" />
          </Form.Item>
          <Form.Item
            name="password"
            label="Mật khẩu"
            rules={[{ required: true }]}
          >
            <Input type="password" />
          </Form.Item>
          <Form.Item
            name="role"
            label="Loại tài khoản"
            rules={[{ required: true }]}
          >
            <Select>
              <Option value="admin">Quản Lý</Option>
              <Option value="user">Người Dùng</Option>
            </Select>
          </Form.Item>
          <Form.Item
            name="algorithm"
            label="Loại hệ mật"
            rules={[{ required: true }]}
          >
            <Select>
              <Option value="ECC">ECC (256-bit)</Option>
              <Option value="RSA">RSA (4096-bit)</Option>
            </Select>
          </Form.Item>
        </Form>
      </Modal>
      <Modal
        open={isModalVisible}
        title="Chỉnh sửa Thông tin tài khoản"
        onCancel={() => setIsModalVisible(false)}
        footer={
          <div className="flex items-center w-full justify-end gap-[12px]">
            <Button onClick={() => setIsModalVisible(false)}>Huỷ</Button>
            <Button type="primary" onClick={() => form.submit()}>
              Lưu
            </Button>
          </div>
        }
      >
        <Form form={form} layout="vertical" onFinish={handleSubmit}>
          <Form.Item name="name" label="Họ và tên" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item name="phone" label="Số Điện Thoại">
            <Input />
          </Form.Item>
          <Form.Item name="address" label="Địa Chỉ">
            <Input />
          </Form.Item>
          <Form.Item name="gender" label="Giới Tính">
            <Select>
              <Option value="Nam">Nam</Option>
              <Option value="Nữ">Nữ</Option>
            </Select>
          </Form.Item>
          <Form.Item name="dob" label="Ngày Sinh">
            <DatePicker />
          </Form.Item>
          <Form.Item name="role" label="Loại tài khoản">
            <Select>
              <Option value="admin">Quản Lý</Option>
              <Option value="user">Người Dùng</Option>
            </Select>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};
