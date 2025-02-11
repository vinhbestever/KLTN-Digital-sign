import { Button, DatePicker, Input, Table, message } from 'antd';
import React, { useEffect, useState } from 'react';
import axiosInstance from '../../api/axiosConfig';
import { CloudDownloadOutlined } from '@ant-design/icons';

const { Search } = Input;
const { RangePicker } = DatePicker;

export const History = () => {
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [dateRange, setDateRange] = useState([]);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [total, setTotal] = useState(0);

  useEffect(() => {
    fetchSignedFiles();
  }, [searchTerm, dateRange, page, pageSize]);

  const fetchSignedFiles = async () => {
    setLoading(true);
    try {
      const response = await axiosInstance.get('api/files/signed-files', {
        params: {
          search: searchTerm,
          startDate:
            dateRange.length > 0 ? dateRange[0].format('YYYY-MM-DD') : null,
          endDate:
            dateRange.length > 0 ? dateRange[1].format('YYYY-MM-DD') : null,
          page,
          pageSize,
        },
      });
      setFiles(response.data.files);
      setTotal(response.data.total);
    } catch (error) {
      console.error('Lỗi khi lấy danh sách file đã ký:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = async (fileId, fileName) => {
    try {
      console.log('(fileId, fileName', fileId, fileName);

      const response = await axiosInstance.get(
        `api/files/download-signed/${fileId}`,
        {
          responseType: 'blob',
        }
      );

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const a = document.createElement('a');
      a.href = url;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      message.success('Tải file thành công!');
    } catch (error) {
      console.error('Lỗi khi tải file đã ký:', error);
      message.error('Lỗi khi tải file!');
    }
  };

  const columns = [
    {
      title: 'Số Thứ Tự',
      dataIndex: 'index',
      key: 'index',
      render: (_, __, index) => (page - 1) * pageSize + index + 1,
    },
    {
      title: 'Tên File',
      dataIndex: 'file_name',
      key: 'file_name',
    },
    {
      title: 'Ngày Đã Ký',
      dataIndex: 'signed_at',
      key: 'signed_at',
      render: (signed_at) => new Date(signed_at).toLocaleDateString(),
    },
    {
      title: 'Hành Động',
      key: 'action',
      render: (record) => (
        <div className="ml-9">
          <Button
            onClick={() => handleDownload(record.id, record.file_name)}
            icon={<CloudDownloadOutlined />}
          ></Button>
        </div>
      ),
    },
  ];

  return (
    <div className="p-[32px] flex flex-col w-full h-full gap-[18px]">
      <div className="text-[22px] font-medium">Lịch sử ký</div>
      <div className="w-full h-full bg-white rounded-lg shadow-lg flex flex-col items-center p-[20px] overflow-auto gap-[18px]">
        <div className="w-full flex items-center justify-between">
          <div className="text-[16px]">Danh sách file đã ký</div>

          <div className="flex items-center justify-end gap-[10px]">
            <Button type="primary">Xuất báo cáo</Button>
            <Button
              onClick={() => {
                window.location.href = '/sign';
              }}
            >
              Ký mới
            </Button>
          </div>
        </div>

        <div className="flex w-full items-center gap-[12px]">
          <Search
            placeholder="Tìm kiếm tên file"
            allowClear
            onSearch={(value) => setSearchTerm(value)}
            style={{ width: 350 }}
          />
          <RangePicker
            placeholder={['Từ ngày', 'Đến ngày']}
            onChange={(dates) => setDateRange(dates || [])}
          />
        </div>

        <Table
          columns={columns}
          dataSource={files}
          loading={loading}
          rowKey="id"
          style={{ width: '100%' }}
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
  );
};
