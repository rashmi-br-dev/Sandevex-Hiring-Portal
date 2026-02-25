"use client";

import { useEffect, useState } from "react";
import {
    Card, Row, Col, Statistic, Table, Tag, Typography, 
    Timeline, Progress, DatePicker, Button, Space
} from "antd";
import {
    UserOutlined, TrophyOutlined, CheckCircleOutlined,
    CloseCircleOutlined, DollarOutlined, FileTextOutlined,
    CalendarOutlined, RiseOutlined, BarChartOutlined
} from "@ant-design/icons";
import type { ColumnsType } from "antd/es/table";
import type { Dayjs } from "dayjs";
import type { RangePickerProps } from "antd/es/date-picker";

const { Title, Text } = Typography;
const { RangePicker } = DatePicker;

interface SummaryData {
    totalStats: {
        totalInterns: number;
        activeInterns: number;
        completedInterns: number;
        terminatedInterns: number;
        feePaidInterns: number;
        certificateIssuedInterns: number;
        offerLetterIssuedInterns: number;
    };
    domainStats: Array<{
        domain: string;
        total: number;
        active: number;
        completed: number;
        terminated: number;
        feePaid: number;
        certificateIssued: number;
    }>;
    monthlyConversions: Array<{
        month: string;
        count: number;
        domains: Record<string, number>;
    }>;
    recentActivity: Array<{
        _id: string;
        fullName: string;
        email: string;
        preferredDomain: string;
        internshipStatus: string;
        createdAt: string;
        updatedAt: string;
        activity: 'created' | 'updated';
    }>;
    skillLevelStats: Array<{
        level: string;
        count: number;
    }>;
    interns: Array<{
        _id: string;
        fullName: string;
        email: string;
        preferredDomain: string;
        internshipStatus: string;
        createdAt: string;
    }>;
    auditLogs?: Array<{
        _id: string;
        entityType: string;
        action: string;
        performedBy: string;
        performedAt: string;
        description: string;
        changes: Record<string, { from: any; to: any }>;
    }>;
    auditStats?: {
        totalLogs: number;
        createActions: number;
        updateActions: number;
        deleteActions: number;
        internLogs: number;
        profileLogs: number;
    };
}

export default function InternsSummaryPage() {
    const [data, setData] = useState<SummaryData | null>(null);
    const [loading, setLoading] = useState(false);
    const [dateRange, setDateRange] = useState<[Dayjs | null, Dayjs | null] | null>(null);

    const fetchSummary = async () => {
        try {
            setLoading(true);
            const url = dateRange && dateRange[0] && dateRange[1]
                ? `/api/interns/summary?startDate=${dateRange[0].toISOString()}&endDate=${dateRange[1].toISOString()}`
                : '/api/interns/summary';
            
            const [summaryRes, auditRes] = await Promise.all([
                fetch(url),
                fetch('/api/audit-logs?limit=20')
            ]);

            const summaryResult = await summaryRes.json();
            const auditResult = await auditRes.json();

            if (!summaryRes.ok) throw new Error(summaryResult.error);
            if (!auditRes.ok) throw new Error(auditResult.error);

            setData({
                ...summaryResult.data,
                auditLogs: auditResult.data.logs,
                auditStats: auditResult.data.stats
            });
        } catch (error: any) {
            console.error("Error fetching summary:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchSummary();
    }, [dateRange]);

    const domainColumns: ColumnsType<any> = [
        {
            title: "Domain",
            dataIndex: "domain",
            key: "domain",
            render: (domain) => <Text strong>{domain}</Text>
        },
        {
            title: "Total",
            dataIndex: "total",
            key: "total",
            render: (total) => <Tag color="blue">{total}</Tag>
        },
        {
            title: "Active",
            dataIndex: "active",
            key: "active",
            render: (active) => <Tag color="green">{active}</Tag>
        },
        {
            title: "Completed",
            dataIndex: "completed",
            key: "completed",
            render: (completed) => <Tag color="processing">{completed}</Tag>
        },
        {
            title: "Terminated",
            dataIndex: "terminated",
            key: "terminated",
            render: (terminated) => <Tag color="error">{terminated}</Tag>
        },
        {
            title: "Fee Paid",
            dataIndex: "feePaid",
            key: "feePaid",
            render: (feePaid, record) => (
                <div>
                    <Tag color="green">{feePaid}</Tag>
                    <Progress 
                        percent={Math.round((feePaid / record.total) * 100)} 
                        size="small" 
                        showInfo={false}
                    />
                </div>
            )
        },
        {
            title: "Certificates",
            dataIndex: "certificateIssued",
            key: "certificateIssued",
            render: (certificates, record) => (
                <div>
                    <Tag color="purple">{certificates}</Tag>
                    <Progress 
                        percent={Math.round((certificates / record.total) * 100)} 
                        size="small" 
                        showInfo={false}
                    />
                </div>
            )
        }
    ];

    const activityColumns: ColumnsType<any> = [
        {
            title: "Intern",
            dataIndex: "fullName",
            key: "fullName",
            render: (name, record) => (
                <div>
                    <div className="font-medium">{name}</div>
                    <div className="text-xs text-gray-500">{record.email}</div>
                </div>
            )
        },
        {
            title: "Domain",
            dataIndex: "preferredDomain",
            key: "preferredDomain",
            render: (domain) => <Tag>{domain}</Tag>
        },
        {
            title: "Status",
            dataIndex: "internshipStatus",
            key: "internshipStatus",
            render: (status) => {
                const colors: Record<string, string> = {
                    active: 'green',
                    completed: 'processing',
                    terminated: 'error',
                    not_started: 'default'
                };
                return <Tag color={colors[status]}>{status}</Tag>;
            }
        },
        {
            title: "Activity",
            dataIndex: "activity",
            key: "activity",
            render: (activity) => (
                <Tag color={activity === 'created' ? 'blue' : 'orange'}>
                    {activity === 'created' ? 'Created' : 'Updated'}
                </Tag>
            )
        },
        {
            title: "Date",
            dataIndex: "updatedAt",
            key: "updatedAt",
            render: (date) => new Date(date).toLocaleDateString()
        }
    ];

    if (!data) {
        return <div className="p-4">Loading...</div>;
    }

    return (
        <div className="p-6 space-y-6">
            {/* Header */}
            <div className="flex justify-between items-center">
                <Title level={2} className="!mb-0">Interns Summary</Title>
                <Space>
                    <RangePicker onChange={setDateRange} />
                    <Button onClick={fetchSummary} loading={loading}>
                        Refresh
                    </Button>
                </Space>
            </div>

            {/* Overall Statistics */}
            <Row gutter={[16, 16]}>
                <Col xs={24} sm={12} md={8} lg={6}>
                    <Card>
                        <Statistic
                            title="Total Interns"
                            value={data.totalStats.totalInterns}
                            prefix={<UserOutlined />}
                            valueStyle={{ color: "#1890ff" }}
                        />
                    </Card>
                </Col>
                <Col xs={24} sm={12} md={8} lg={6}>
                    <Card>
                        <Statistic
                            title="Active Interns"
                            value={data.totalStats.activeInterns}
                            prefix={<RiseOutlined />}
                            valueStyle={{ color: "#52c41a" }}
                        />
                    </Card>
                </Col>
                <Col xs={24} sm={12} md={8} lg={6}>
                    <Card>
                        <Statistic
                            title="Completed"
                            value={data.totalStats.completedInterns}
                            prefix={<TrophyOutlined />}
                            valueStyle={{ color: "#722ed1" }}
                        />
                    </Card>
                </Col>
                <Col xs={24} sm={12} md={8} lg={6}>
                    <Card>
                        <Statistic
                            title="Fee Paid"
                            value={data.totalStats.feePaidInterns}
                            prefix={<DollarOutlined />}
                            valueStyle={{ color: "#fa8c16" }}
                        />
                    </Card>
                </Col>
            </Row>

            <Row gutter={[16, 16]}>
                <Col xs={24} sm={12} md={8} lg={6}>
                    <Card>
                        <Statistic
                            title="Terminated"
                            value={data.totalStats.terminatedInterns}
                            prefix={<CloseCircleOutlined />}
                            valueStyle={{ color: "#f5222d" }}
                        />
                    </Card>
                </Col>
                <Col xs={24} sm={12} md={8} lg={6}>
                    <Card>
                        <Statistic
                            title="Certificates Issued"
                            value={data.totalStats.certificateIssuedInterns}
                            prefix={<FileTextOutlined />}
                            valueStyle={{ color: "#13c2c2" }}
                        />
                    </Card>
                </Col>
                <Col xs={24} sm={12} md={8} lg={6}>
                    <Card>
                        <Statistic
                            title="Offer Letters"
                            value={data.totalStats.offerLetterIssuedInterns}
                            prefix={<CheckCircleOutlined />}
                            valueStyle={{ color: "#52c41a" }}
                        />
                    </Card>
                </Col>
                <Col xs={24} sm={12} md={8} lg={6}>
                    <Card>
                        <Statistic
                            title="Completion Rate"
                            value={data.totalStats.totalInterns > 0 
                                ? Math.round((data.totalStats.completedInterns / data.totalStats.totalInterns) * 100) 
                                : 0}
                            suffix="%"
                            prefix={<BarChartOutlined />}
                            valueStyle={{ color: "#1890ff" }}
                        />
                    </Card>
                </Col>
            </Row>

            {/* Domain Analysis */}
            <Card title="Domain Analysis" className="shadow-sm">
                <Table
                    columns={domainColumns}
                    dataSource={data.domainStats}
                    rowKey="domain"
                    pagination={false}
                    size="small"
                />
            </Card>

            {/* Monthly Conversions */}
            <Card title="Monthly Conversions" className="shadow-sm">
                <div className="space-y-4">
                    {data.monthlyConversions.map((month) => (
                        <div key={month.month} className="border rounded p-4">
                            <div className="flex justify-between items-center mb-2">
                                <Text strong>{month.month}</Text>
                                <Tag color="blue">{month.count} interns</Tag>
                            </div>
                            <div className="flex flex-wrap gap-2">
                                {Object.entries(month.domains).map(([domain, count]) => (
                                    <Tag key={domain} color="geekblue">
                                        {domain}: {count}
                                    </Tag>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            </Card>

            {/* Recent Activity */}
            <Row gutter={[16, 16]}>
                <Col xs={24} lg={16}>
                    <Card title="Recent Activity (Last 30 Days)" className="shadow-sm">
                        <Table
                            columns={activityColumns}
                            dataSource={data.recentActivity}
                            rowKey="_id"
                            pagination={{ pageSize: 5 }}
                            size="small"
                        />
                    </Card>
                </Col>
                <Col xs={24} lg={8}>
                    <Card title="Skill Level Distribution" className="shadow-sm">
                        <div className="space-y-3">
                            {data.skillLevelStats.map((skill) => (
                                <div key={skill.level} className="flex justify-between items-center">
                                    <Text>{skill.level}</Text>
                                    <div className="flex items-center gap-2">
                                        <Progress 
                                            percent={Math.round((skill.count / data.totalStats.totalInterns) * 100)} 
                                            size="small" 
                                            showInfo={false}
                                            style={{ width: 60 }}
                                        />
                                        <Tag>{skill.count}</Tag>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </Card>
                </Col>
            </Row>

            {/* Recent Interns */}
            <Card title="Recent Interns" className="shadow-sm">
                <Table
                    columns={[
                        {
                            title: "Name",
                            dataIndex: "fullName",
                            key: "fullName",
                            render: (name, record) => (
                                <div>
                                    <div className="font-medium">{name}</div>
                                    <div className="text-xs text-gray-500">{record.email}</div>
                                </div>
                            )
                        },
                        {
                            title: "Domain",
                            dataIndex: "preferredDomain",
                            key: "preferredDomain",
                            render: (domain) => <Tag>{domain}</Tag>
                        },
                        {
                            title: "Status",
                            dataIndex: "internshipStatus",
                            key: "internshipStatus",
                            render: (status) => {
                                const colors: Record<string, string> = {
                                    active: 'green',
                                    completed: 'processing',
                                    terminated: 'error',
                                    not_started: 'default'
                                };
                                return <Tag color={colors[status]}>{status}</Tag>;
                            }
                        },
                        {
                            title: "Joined",
                            dataIndex: "createdAt",
                            key: "createdAt",
                            render: (date) => new Date(date).toLocaleDateString()
                        }
                    ]}
                    dataSource={data.interns}
                    rowKey="_id"
                    pagination={{ pageSize: 5 }}
                    size="small"
                />
            </Card>

            {/* Audit Logs Section */}
            {data.auditStats && (
                <Row gutter={[16, 16]}>
                    <Col xs={24} lg={16}>
                        <Card title="Recent Audit Logs" className="shadow-sm">
                            <Table
                                columns={[
                                    {
                                        title: "Action",
                                        dataIndex: "action",
                                        key: "action",
                                        render: (action) => {
                                            const colors: Record<string, string> = {
                                                create: 'green',
                                                update: 'blue',
                                                delete: 'red'
                                            };
                                            return <Tag color={colors[action]}>{action.toUpperCase()}</Tag>;
                                        }
                                    },
                                    {
                                        title: "Entity",
                                        dataIndex: "entityType",
                                        key: "entityType",
                                        render: (entityType) => (
                                            <Tag color="purple">{entityType.replace('_', ' ').toUpperCase()}</Tag>
                                        )
                                    },
                                    {
                                        title: "Description",
                                        dataIndex: "description",
                                        key: "description",
                                        ellipsis: true
                                    },
                                    {
                                        title: "User",
                                        dataIndex: "performedBy",
                                        key: "performedBy",
                                        render: (user) => <Text code>{user}</Text>
                                    },
                                    {
                                        title: "Date",
                                        dataIndex: "performedAt",
                                        key: "performedAt",
                                        render: (date) => (
                                            <div>
                                                <div>{new Date(date).toLocaleDateString()}</div>
                                                <div className="text-xs text-gray-500">
                                                    {new Date(date).toLocaleTimeString()}
                                                </div>
                                            </div>
                                        )
                                    }
                                ]}
                                dataSource={data.auditLogs}
                                rowKey="_id"
                                pagination={{ pageSize: 5 }}
                                size="small"
                            />
                        </Card>
                    </Col>
                    <Col xs={24} lg={8}>
                        <Card title="Audit Statistics" className="shadow-sm">
                            <div className="space-y-4">
                                <div className="flex justify-between items-center">
                                    <Text>Total Logs:</Text>
                                    <Tag color="blue">{data.auditStats.totalLogs}</Tag>
                                </div>
                                <div className="flex justify-between items-center">
                                    <Text>Creates:</Text>
                                    <Tag color="green">{data.auditStats.createActions}</Tag>
                                </div>
                                <div className="flex justify-between items-center">
                                    <Text>Updates:</Text>
                                    <Tag color="blue">{data.auditStats.updateActions}</Tag>
                                </div>
                                <div className="flex justify-between items-center">
                                    <Text>Deletes:</Text>
                                    <Tag color="red">{data.auditStats.deleteActions}</Tag>
                                </div>
                                <div className="flex justify-between items-center">
                                    <Text>Intern Logs:</Text>
                                    <Tag color="purple">{data.auditStats.internLogs}</Tag>
                                </div>
                                <div className="flex justify-between items-center">
                                    <Text>Profile Logs:</Text>
                                    <Tag color="orange">{data.auditStats.profileLogs}</Tag>
                                </div>
                            </div>
                        </Card>
                    </Col>
                </Row>
            )}
        </div>
    );
}
