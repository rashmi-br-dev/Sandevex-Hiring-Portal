"use client";

import { useEffect, useState, useMemo } from "react";
import {
    Table, Tag, Button, Space, Typography, Input, message,
    Tooltip, Dropdown, Badge, Modal, Tabs, Form, Select, DatePicker,
    Checkbox, InputNumber
} from "antd";
import type { ColumnsType, TablePaginationConfig } from "antd/es/table";
import type { MenuProps } from "antd";
import {
    ReloadOutlined, SearchOutlined, FilterOutlined,
    BarChartOutlined, UserOutlined, CheckCircleOutlined,
    ClockCircleOutlined, FileTextOutlined, EditOutlined
} from "@ant-design/icons";
import StudentDetailsModal from "@/components/StudentDetailsModal";

const { Title } = Typography;

interface Intern {
    _id: string;
    fullName: string;
    email: string;
    mobile?: string;
    collegeName?: string;
    degree?: string;
    branch?: string;
    yearOfStudy?: string;
    cityState?: string;
    address?: string;
    preferredDomain?: string;
    skillLevel?: string;
    technicalSkills?: string[];
    priorExperience?: string;
    portfolioUrl?: string;
    offerStatus: "not_sent" | "sent" | "accepted" | "declined" | "expired";
    internshipStatus: "not_started" | "active" | "completed" | "terminated";
    internshipFeePaid: boolean;
    feePaidAt?: Date;
    offerLetterIssued: boolean;
    offerLetterIssuedAt?: Date;
    offerLetterUrl?: string;
    certificateIssued: boolean;
    certificateIssuedAt?: Date;
    certificateUrl?: string;
    joinedAt?: Date;
    completedAt?: Date;
    notes?: string;
    createdAt: string;
    updatedAt: string;
}

export default function InternsPage() {
    const [interns, setInterns] = useState<Intern[]>([]);
    const [loading, setLoading] = useState(false);
    const [search, setSearch] = useState("");
    const [statusFilter, setStatusFilter] = useState<string | undefined>(undefined);
    const [internshipFilter, setInternshipFilter] = useState<string | undefined>(undefined);
    const [summaryModalVisible, setSummaryModalVisible] = useState(false);
    const [studentModalVisible, setStudentModalVisible] = useState(false);
    const [editModalVisible, setEditModalVisible] = useState(false);
    const [viewModalVisible, setViewModalVisible] = useState(false);
    const [selectedIntern, setSelectedIntern] = useState<any>(null);
    const [editForm] = Form.useForm();

    const [pagination, setPagination] = useState<TablePaginationConfig>({
        current: 1,
        pageSize: 10,
        total: 0,
    });

    // Fetch interns
    const fetchInterns = async () => {
        try {
            setLoading(true);
            const res = await fetch(`/api/interns`);
            const data = await res.json();

            if (!res.ok) throw new Error(data.error);

            setInterns(data.interns || []);
            setPagination(prev => ({
                ...prev,
                total: data.interns?.length || 0,
            }));
        } catch (error: any) {
            message.error(error.message || "Failed to load interns");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchInterns();
    }, []);

    // Apply filters
    const filteredInterns = useMemo(() => {
        let filtered = [...interns];

        // Apply search filter
        if (search) {
            const searchLower = search.toLowerCase();
            filtered = filtered.filter(intern =>
                intern.fullName?.toLowerCase().includes(searchLower) ||
                intern.email?.toLowerCase().includes(searchLower) ||
                intern.collegeName?.toLowerCase().includes(searchLower) ||
                intern.mobile?.includes(search)
            );
        }

        // Apply offer status filter
        if (statusFilter && statusFilter !== 'all') {
            filtered = filtered.filter(intern =>
                intern.offerStatus === statusFilter
            );
        }

        // Apply internship status filter
        if (internshipFilter && internshipFilter !== 'all') {
            filtered = filtered.filter(intern =>
                intern.internshipStatus === internshipFilter
            );
        }

        return filtered;
    }, [interns, search, statusFilter, internshipFilter]);

    // Get paginated data
    const paginatedInterns = useMemo(() => {
        const start = (pagination.current! - 1) * pagination.pageSize!;
        const end = start + pagination.pageSize!;
        return filteredInterns.slice(start, end);
    }, [filteredInterns, pagination.current, pagination.pageSize]);

    // Update total when filters change
    useEffect(() => {
        setPagination(prev => ({
            ...prev,
            current: 1,
            total: filteredInterns.length,
        }));
    }, [filteredInterns.length]);

    // Row click handler
    const handleRowClick = (record: Intern) => {
        setSelectedIntern(record);
        setViewModalVisible(true);
    };

    // Filter menu items
    const statusFilterItems: MenuProps['items'] = [
        { key: 'all', label: 'All', onClick: () => setStatusFilter(undefined) },
        { type: 'divider' },
        { key: 'not_sent', label: <span><UserOutlined className="mr-2 text-gray-500" /> Not Sent</span>, onClick: () => setStatusFilter('not_sent') },
        { key: 'sent', label: <span><FileTextOutlined className="mr-2 text-blue-500" /> Sent</span>, onClick: () => setStatusFilter('sent') },
        { key: 'accepted', label: <span><CheckCircleOutlined className="mr-2 text-green-500" /> Accepted</span>, onClick: () => setStatusFilter('accepted') },
        { key: 'declined', label: <span><CheckCircleOutlined className="mr-2 text-red-500" /> Declined</span>, onClick: () => setStatusFilter('declined') },
        { key: 'expired', label: <span><ClockCircleOutlined className="mr-2 text-gray-500" /> Expired</span>, onClick: () => setStatusFilter('expired') },
    ];

    const internshipFilterItems: MenuProps['items'] = [
        { key: 'all', label: 'All', onClick: () => setInternshipFilter(undefined) },
        { type: 'divider' },
        { key: 'not_started', label: <span><ClockCircleOutlined className="mr-2 text-gray-500" /> Not Started</span>, onClick: () => setInternshipFilter('not_started') },
        { key: 'active', label: <span><CheckCircleOutlined className="mr-2 text-green-500" /> Active</span>, onClick: () => setInternshipFilter('active') },
        { key: 'completed', label: <span><CheckCircleOutlined className="mr-2 text-blue-500" /> Completed</span>, onClick: () => setInternshipFilter('completed') },
        { key: 'terminated', label: <span><CheckCircleOutlined className="mr-2 text-red-500" /> Terminated</span>, onClick: () => setInternshipFilter('terminated') },
    ];

    const columns: ColumnsType<Intern> = [
        {
            title: "Intern",
            key: "intern",
            width: 200,
            render: (_, r) => (
                <div>
                    <div className="font-medium">{r.fullName}</div>
                    <div className="text-xs text-gray-500">{r.email}</div>
                    {r.mobile && (
                        <div className="text-xs text-gray-400">{r.mobile}</div>
                    )}
                </div>
            ),
        },
        {
            title: "College",
            key: "college",
            width: 150,
            render: (_, r) => (
                <span className="text-xs text-gray-700 dark:text-gray-300">
                    {r.collegeName || '-'}
                </span>
            ),
        },
        {
            title: "Preferred Domain",
            key: "preferredDomain",
            width: 150,
            render: (_, r) => r.preferredDomain || '-',
        },
        {
            title: "Skill Level",
            key: "skillLevel",
            width: 120,
            render: (_, r) => r.skillLevel || '-',
        },
        {
            title: (
                <div className="flex items-center">
                    <span className="mr-2">Offer Status</span>
                    <Dropdown
                        menu={{
                            items: statusFilterItems,
                            selectedKeys: statusFilter ? [statusFilter] : ['all']
                        }}
                        trigger={['click']}
                    >
                        <Button
                            type="text"
                            icon={<FilterOutlined />}
                            size="small"
                            className={statusFilter ? 'text-blue-500' : ''}
                        />
                    </Dropdown>
                </div>
            ),
            key: "offerStatus",
            width: 130,
            render: (_, r) => (
                <Tag
                    color={r.offerStatus === 'accepted' ? 'success' :
                        r.offerStatus === 'sent' ? 'processing' :
                            r.offerStatus === 'declined' ? 'error' : 'default'}
                    className="px-3 py-1"
                >
                    {r.offerStatus}
                </Tag>
            ),
        },
        {
            title: (
                <div className="flex items-center">
                    <span className="mr-2">Internship</span>
                    <Dropdown
                        menu={{
                            items: internshipFilterItems,
                            selectedKeys: internshipFilter ? [internshipFilter] : ['all']
                        }}
                        trigger={['click']}
                    >
                        <Button
                            type="text"
                            icon={<FilterOutlined />}
                            size="small"
                            className={internshipFilter ? 'text-blue-500' : ''}
                        />
                    </Dropdown>
                </div>
            ),
            key: "internshipStatus",
            width: 130,
            render: (_, r) => (
                <Tag
                    color={r.internshipStatus === 'active' ? 'success' :
                        r.internshipStatus === 'completed' ? 'processing' :
                            r.internshipStatus === 'terminated' ? 'error' : 'default'}
                    className="px-3 py-1"
                >
                    {r.internshipStatus}
                </Tag>
            ),
        },
        {
            title: "Fee Status",
            key: "feeStatus",
            width: 100,
            render: (_, r) => (
                <Tag
                    color={r.internshipFeePaid ? 'success' : 'warning'}
                    className="px-3 py-1"
                >
                    {r.internshipFeePaid ? 'Paid' : 'Unpaid'}
                </Tag>
            ),
        },
        {
            title: "Joined",
            key: "joinedAt",
            width: 100,
            render: (_, r) => r.joinedAt ? new Date(r.joinedAt).toLocaleDateString() : '-',
        },
        {
            title: "Actions",
            key: "actions",
            width: 80,
            render: (_, record) => (
                <Space>
                    <Tooltip title="Edit Intern">
                        <Button
                            type="text"
                            icon={<EditOutlined />}
                            size="small"
                            onClick={(e) => {
                                e.stopPropagation();
                                handleEdit(record);
                            }}
                        />
                    </Tooltip>
                </Space>
            ),
        },
    ];

    const handleTableChange = (newPagination: TablePaginationConfig) => {
        setPagination({
            ...newPagination,
            total: filteredInterns.length,
        });
    };

    const clearFilters = () => {
        setSearch("");
        setStatusFilter(undefined);
        setInternshipFilter(undefined);
    };

    // Edit handlers
    const handleEdit = (record: Intern) => {
        setSelectedIntern(record);
        editForm.setFieldsValue(record);
        setEditModalVisible(true);
    };

    const handleEditSave = async () => {
        try {
            const values = await editForm.validateFields();
            console.log('Form values:', values);
            console.log('Selected intern:', selectedIntern);
            console.log('Selected intern ID:', selectedIntern?._id);

            if (!selectedIntern?._id) {
                throw new Error('No intern ID available');
            }

            const url = `/api/interns/${selectedIntern._id}`;
            console.log('Making request to:', url);

            const response = await fetch(url, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(values),
            });

            const result = await response.json();
            console.log('API response status:', response.status);
            console.log('API response:', result);

            if (!response.ok) {
                throw new Error(result.error || 'Failed to update intern');
            }

            message.success('Intern updated successfully');
            setEditModalVisible(false);
            fetchInterns();
        } catch (error: any) {
            console.error('Update error:', error);
            message.error(error.message || 'Failed to update intern');
        }
    };

    // Count active filters
    const activeFilterCount = [
        statusFilter ? 1 : 0,
        internshipFilter ? 1 : 0,
        search ? 1 : 0
    ].reduce((a, b) => a + b, 0);

    return (
        <div className="p-4 space-y-0">
            {/* Header */}
            <div className="flex justify-between items-center">
                <div className="flex items-center gap-3">
                    <Title level={3} className="!mb-0">
                        Interns
                    </Title>
                    <Tooltip title="Refresh">
                        <Button
                            icon={<ReloadOutlined />}
                            onClick={fetchInterns}
                            shape="circle"
                        />
                    </Tooltip>
                    <Tooltip title="View Summary">
                        <Button
                            icon={<BarChartOutlined />}
                            onClick={() => setSummaryModalVisible(true)}
                            type="primary"
                        >
                            Summary
                        </Button>
                    </Tooltip>
                </div>

                {/* Search and Clear on the right */}
                <div className="flex gap-4 items-center">
                    <Badge count={activeFilterCount} size="small">
                        <Input
                            placeholder="Search interns..."
                            prefix={<SearchOutlined className="text-gray-400" />}
                            allowClear
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            style={{ width: 250 }}
                        />
                    </Badge>

                    {(search || statusFilter || internshipFilter) && (
                        <Button icon={<FilterOutlined />} onClick={clearFilters}>
                            Clear All
                        </Button>
                    )}
                </div>
            </div>

            {/* Active Filters Display */}
            <div className="min-h-[30px]">
                {(statusFilter || internshipFilter) ? (
                    <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-sm text-muted-foreground">Active filters:</span>
                        {statusFilter && (
                            <Tag
                                closable
                                onClose={() => setStatusFilter(undefined)}
                                className="flex items-center bg-secondary text-secondary-foreground border border-border"
                            >
                                Status: {statusFilter}
                            </Tag>
                        )}
                        {internshipFilter && (
                            <Tag
                                closable
                                onClose={() => setInternshipFilter(undefined)}
                                className="flex items-center bg-secondary text-secondary-foreground border border-border"
                            >
                                Internship: {internshipFilter}
                            </Tag>
                        )}
                    </div>
                ) : null}
            </div>

            {/* Table */}
            <Table
                rowKey="_id"
                columns={columns}
                dataSource={paginatedInterns}
                loading={loading}
                onChange={handleTableChange}
                onRow={(record) => ({
                    onClick: () => handleRowClick(record),
                    className: 'cursor-pointer hover:bg-accent'
                })}
                pagination={{
                    ...pagination,
                    showSizeChanger: true,
                    pageSizeOptions: ["10", "20", "50", "100"],
                    showTotal: (total, range) =>
                        `${range[0]}-${range[1]} of ${total} interns`,
                }}
                scroll={{ y: "calc(100vh - 350px)" }}
                locale={{
                    emptyText: loading ? 'Loading...' : 'No interns found'
                }}
            />

            {/* Student Details Modal */}
            <StudentDetailsModal
                visible={studentModalVisible}
                student={selectedIntern}
                onClose={() => setStudentModalVisible(false)}
                offerStatuses={{}}
            />

            {/* Intern Details Modal */}
            <Modal
                title="Intern Details"
                open={viewModalVisible}
                onCancel={() => setViewModalVisible(false)}
                width={800}
                centered
                footer={[
                    <Button key="close" onClick={() => setViewModalVisible(false)}>
                        Close
                    </Button>
                ]}
                styles={{ body: { height: '500px', overflowY: 'auto' } }}
            >
                {selectedIntern && (
                    <Tabs
                        defaultActiveKey="internData"
                        items={[
                            {
                                key: 'internData',
                                label: 'Intern Data',
                                children: (
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="font-medium text-gray-600 block mb-4">Full Name:</label>
                                            <p className="mt-1">{selectedIntern.fullName || '-'}</p>
                                        </div>
                                        <div>
                                            <label className="font-medium text-gray-600 block mb-4">Email:</label>
                                            <p className="mt-1">{selectedIntern.email || '-'}</p>
                                        </div>
                                        <div>
                                            <label className="font-medium text-gray-600 block mb-4">Mobile:</label>
                                            <p className="mt-1">{selectedIntern.mobile || '-'}</p>
                                        </div>
                                        <div>
                                            <label className="font-medium text-gray-600 block mb-4">College Name:</label>
                                            <p className="mt-1">{selectedIntern.collegeName || '-'}</p>
                                        </div>
                                        <div>
                                            <label className="font-medium text-gray-600 block mb-4">Degree:</label>
                                            <p className="mt-1">{selectedIntern.degree || '-'}</p>
                                        </div>
                                        <div>
                                            <label className="font-medium text-gray-600 block mb-4">Branch:</label>
                                            <p className="mt-1">{selectedIntern.branch || '-'}</p>
                                        </div>
                                        <div>
                                            <label className="font-medium text-gray-600 block mb-4">Year of Study:</label>
                                            <p className="mt-1">{selectedIntern.yearOfStudy || '-'}</p>
                                        </div>
                                        <div>
                                            <label className="font-medium text-gray-600 block mb-4">City/State:</label>
                                            <p className="mt-1">{selectedIntern.cityState || '-'}</p>
                                        </div>
                                        <div className="col-span-2">
                                            <label className="font-medium text-gray-600 block mb-4">Address:</label>
                                            <p className="mt-1">{selectedIntern.address || '-'}</p>
                                        </div>
                                    </div>
                                )
                            },
                            {
                                key: 'internProfile',
                                label: 'Intern Profile',
                                children: (
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="font-medium text-gray-600 block mb-4">Preferred Domain:</label>
                                            <p className="mt-1">{selectedIntern.preferredDomain || '-'}</p>
                                        </div>
                                        <div>
                                            <label className="font-medium text-gray-600 block mb-4">Skill Level:</label>
                                            <p className="mt-1">{selectedIntern.skillLevel || '-'}</p>
                                        </div>
                                        <div>
                                            <label className="font-medium text-gray-600 block mb-4">Offer Status:</label>
                                            <p className="mt-1">
                                                <Tag
                                                    color={selectedIntern.offerStatus === 'accepted' ? 'success' :
                                                        selectedIntern.offerStatus === 'sent' ? 'processing' :
                                                            selectedIntern.offerStatus === 'declined' ? 'error' : 'default'}
                                                >
                                                    {selectedIntern.offerStatus || '-'}
                                                </Tag>
                                            </p>
                                        </div>
                                        <div>
                                            <label className="font-medium text-gray-600 block mb-4">Internship Status:</label>
                                            <p className="mt-1">
                                                <Tag
                                                    color={selectedIntern.internshipStatus === 'active' ? 'success' :
                                                        selectedIntern.internshipStatus === 'completed' ? 'processing' :
                                                            selectedIntern.internshipStatus === 'terminated' ? 'error' : 'default'}
                                                >
                                                    {selectedIntern.internshipStatus || '-'}
                                                </Tag>
                                            </p>
                                        </div>
                                        <div>
                                            <label className="font-medium text-gray-600 block mb-4">Internship Fee Paid:</label>
                                            <p className="mt-1">
                                                <Tag color={selectedIntern.internshipFeePaid ? 'success' : 'warning'}>
                                                    {selectedIntern.internshipFeePaid ? 'Paid' : 'Unpaid'}
                                                </Tag>
                                            </p>
                                        </div>
                                        <div>
                                            <label className="font-medium text-gray-600 block mb-4">Offer Letter Issued:</label>
                                            <p className="mt-1">
                                                <Tag color={selectedIntern.offerLetterIssued ? 'success' : 'default'}>
                                                    {selectedIntern.offerLetterIssued ? 'Issued' : 'Not Issued'}
                                                </Tag>
                                            </p>
                                        </div>
                                        <div>
                                            <label className="font-medium text-gray-600 block mb-4">Certificate Issued:</label>
                                            <p className="mt-1">
                                                <Tag color={selectedIntern.certificateIssued ? 'success' : 'default'}>
                                                    {selectedIntern.certificateIssued ? 'Issued' : 'Not Issued'}
                                                </Tag>
                                            </p>
                                        </div>
                                        <div>
                                            <label className="font-medium text-gray-600 block mb-4">Portfolio URL:</label>
                                            <p className="mt-1">
                                                {selectedIntern.portfolioUrl ? (
                                                    <a href={selectedIntern.portfolioUrl} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline">
                                                        {selectedIntern.portfolioUrl}
                                                    </a>
                                                ) : '-'}
                                            </p>
                                        </div>
                                        <div className="col-span-2">
                                            <label className="font-medium text-gray-600 block mb-4">Technical Skills:</label>
                                            <div className="flex flex-wrap gap-2">
                                                {selectedIntern.technicalSkills && selectedIntern.technicalSkills.length > 0
                                                    ? selectedIntern.technicalSkills.map((skill: string, index: number) => (
                                                        <Tag key={index} className="!m-0">{skill}</Tag>
                                                    ))
                                                    : '-'
                                                }
                                            </div>
                                        </div>
                                        <div className="col-span-2">
                                            <label className="font-medium text-gray-600 block mb-4">Prior Experience:</label>
                                            <p className="mt-1">{selectedIntern.priorExperience || '-'}</p>
                                        </div>
                                        <div className="col-span-2">
                                            <label className="font-medium text-gray-600 block mb-4">Notes:</label>
                                            <p className="mt-1">{selectedIntern.notes || '-'}</p>
                                        </div>
                                        <div>
                                            <label className="font-medium text-gray-600 block mb-4">Joined Date:</label>
                                            <p className="mt-1">{selectedIntern.joinedAt ? new Date(selectedIntern.joinedAt).toLocaleDateString() : '-'}</p>
                                        </div>
                                        <div>
                                            <label className="font-medium text-gray-600 block mb-4">Completed Date:</label>
                                            <p className="mt-1">{selectedIntern.completedAt ? new Date(selectedIntern.completedAt).toLocaleDateString() : '-'}</p>
                                        </div>
                                    </div>
                                )
                            }
                        ]}
                    />
                )}
            </Modal>

            {/* Edit Intern Modal */}
            <Modal
                title="Edit Intern"
                open={editModalVisible}
                onCancel={() => setEditModalVisible(false)}
                onOk={handleEditSave}
                width={800}
                centered
                okText="Save Changes"
                cancelText="Cancel"
                styles={{ body: { height: '500px', overflowY: 'auto', paddingRight: '20px' } }}
            >
                <Form
                    form={editForm}
                    layout="vertical"
                    className="mt-4 "
                >
                    <Tabs
                        defaultActiveKey="internData"
                        items={[
                            {
                                key: 'internData',
                                label: 'Intern Data',
                                children: (
                                    <div className="grid grid-cols-2 gap-4">
                                        <Form.Item
                                            label="Full Name"
                                            name="fullName"
                                            rules={[{ required: true, message: 'Please enter full name' }]}
                                        >
                                            <Input />
                                        </Form.Item>
                                        <Form.Item
                                            label="Email"
                                            name="email"
                                            rules={[{ required: true, type: 'email', message: 'Please enter valid email' }]}
                                        >
                                            <Input />
                                        </Form.Item>
                                        <Form.Item
                                            label="Mobile"
                                            name="mobile"
                                        >
                                            <Input />
                                        </Form.Item>
                                        <Form.Item
                                            label="College Name"
                                            name="collegeName"
                                        >
                                            <Input />
                                        </Form.Item>
                                        <Form.Item
                                            label="Degree"
                                            name="degree"
                                        >
                                            <Input />
                                        </Form.Item>
                                        <Form.Item
                                            label="Branch"
                                            name="branch"
                                        >
                                            <Input />
                                        </Form.Item>
                                        <Form.Item
                                            label="Year of Study"
                                            name="yearOfStudy"
                                        >
                                            <Input />
                                        </Form.Item>
                                        <Form.Item
                                            label="City/State"
                                            name="cityState"
                                        >
                                            <Input />
                                        </Form.Item>
                                        <Form.Item
                                            label="Address"
                                            name="address"
                                            className="col-span-2"
                                        >
                                            <Input.TextArea rows={2} />
                                        </Form.Item>
                                    </div>
                                )
                            },
                            {
                                key: 'internProfile',
                                label: 'Intern Profile',
                                children: (
                                    <div className="grid grid-cols-2 gap-4">
                                        <Form.Item
                                            label="Preferred Domain"
                                            name="preferredDomain"
                                        >
                                            <Input />
                                        </Form.Item>
                                        <Form.Item
                                            label="Skill Level"
                                            name="skillLevel"
                                        >
                                            <Select>
                                                <Select.Option value="Beginner">Beginner</Select.Option>
                                                <Select.Option value="Intermediate">Intermediate</Select.Option>
                                                <Select.Option value="Advanced">Advanced</Select.Option>
                                            </Select>
                                        </Form.Item>
                                        <Form.Item
                                            label="Offer Status"
                                            name="offerStatus"
                                        >
                                            <Select>
                                                <Select.Option value="not_sent">Not Sent</Select.Option>
                                                <Select.Option value="sent">Sent</Select.Option>
                                                <Select.Option value="accepted">Accepted</Select.Option>
                                                <Select.Option value="declined">Declined</Select.Option>
                                                <Select.Option value="expired">Expired</Select.Option>
                                            </Select>
                                        </Form.Item>
                                        <Form.Item
                                            label="Internship Status"
                                            name="internshipStatus"
                                        >
                                            <Select>
                                                <Select.Option value="not_started">Not Started</Select.Option>
                                                <Select.Option value="active">Active</Select.Option>
                                                <Select.Option value="completed">Completed</Select.Option>
                                                <Select.Option value="terminated">Terminated</Select.Option>
                                            </Select>
                                        </Form.Item>
                                        <Form.Item
                                            label="Internship Fee Paid"
                                            name="internshipFeePaid"
                                            valuePropName="checked"
                                        >
                                            <Checkbox />
                                        </Form.Item>
                                        <Form.Item
                                            label="Offer Letter Issued"
                                            name="offerLetterIssued"
                                            valuePropName="checked"
                                        >
                                            <Checkbox />
                                        </Form.Item>
                                        <Form.Item
                                            label="Certificate Issued"
                                            name="certificateIssued"
                                            valuePropName="checked"
                                        >
                                            <Checkbox />
                                        </Form.Item>
                                        <Form.Item
                                            label="Portfolio URL"
                                            name="portfolioUrl"
                                        >
                                            <Input />
                                        </Form.Item>
                                        <Form.Item
                                            label="Technical Skills"
                                            name="technicalSkills"
                                            className="col-span-2"
                                        >
                                            <Select
                                                mode="tags"
                                                placeholder="Add technical skills"
                                                style={{ width: '100%' }}
                                            />
                                        </Form.Item>
                                        <Form.Item
                                            label="Prior Experience"
                                            name="priorExperience"
                                            className="col-span-2"
                                        >
                                            <Input.TextArea rows={3} />
                                        </Form.Item>
                                        <Form.Item
                                            label="Notes"
                                            name="notes"
                                            className="col-span-2"
                                        >
                                            <Input.TextArea rows={3} />
                                        </Form.Item>
                                    </div>
                                )
                            }
                        ]}
                    />
                </Form>
            </Modal>
        </div>
    );
}
