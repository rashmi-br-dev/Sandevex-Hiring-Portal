"use client";

import { useEffect, useState } from "react";
import { Card, Row, Col, Statistic, Table, Tag, Spin, message, Tabs } from "antd";
import {
    PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis,
    CartesianGrid, Tooltip as RechartsTooltip, Legend,
    ResponsiveContainer, LineChart, Line
} from 'recharts';
import {
    UserOutlined, TeamOutlined, RiseOutlined,
    SendOutlined, CheckCircleOutlined, CloseCircleOutlined,
    ClockCircleOutlined, LoadingOutlined, BarChartOutlined,
    LineChartOutlined, PieChartOutlined, StarOutlined,
    TrophyOutlined, DotChartOutlined, ProfileOutlined,
    DashboardOutlined, PartitionOutlined, CodeOutlined,
    BookOutlined, MailOutlined, CalendarOutlined,
    ApartmentOutlined
} from "@ant-design/icons";

const { TabPane } = Tabs;

// Colors for charts
const COLORS = {
    students: ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'],
    offers: ['#8c8c8c', '#1890ff', '#52c41a', '#f5222d', '#faad14']
};

interface DashboardStats {
    // Student stats
    totalStudents: number;
    uniqueColleges: number;
    uniqueSkills: number;
    avgSkillsPerStudent: string;
    totalSkillsMentioned: number;
    studentsWithSkills: number;

    // College distribution
    collegeData: Array<{ name: string; value: number }>;
    skillData: Array<{ name: string; value: number }>;
    domainData: Array<{ name: string; value: number }>;
    yearData: Array<{ name: string; value: number }>;
    dailyApplications: Array<{ date: string; count: number }>;

    // Offer stats
    totalOffers: number;
    notSent: number;
    pending: number;
    accepted: number;
    declined: number;
    expired: number;
    responseRate: number;
    dailyOffers: Array<{ date: string; count: number }>;
    topCollegesByAcceptance: Array<{ name: string; value: number }>;

    // Recent data
    recentStudents: Array<any>;
    recentOffers: Array<any>;
}

export default function DashboardPage() {
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('overview');
    const [stats, setStats] = useState<DashboardStats>({
        totalStudents: 0,
        uniqueColleges: 0,
        uniqueSkills: 0,
        avgSkillsPerStudent: '0',
        totalSkillsMentioned: 0,
        studentsWithSkills: 0,
        collegeData: [],
        skillData: [],
        domainData: [],
        yearData: [],
        dailyApplications: [],
        totalOffers: 0,
        notSent: 0,
        pending: 0,
        accepted: 0,
        declined: 0,
        expired: 0,
        responseRate: 0,
        dailyOffers: [],
        topCollegesByAcceptance: [],
        recentStudents: [],
        recentOffers: []
    });

    useEffect(() => {
        fetchDashboardData();
    }, []);

    const fetchDashboardData = async () => {
        try {
            setLoading(true);
            const res = await fetch('/api/dashboard/stats');
            const data = await res.json();

            if (!res.ok) throw new Error(data.error);

            setStats(data);
        } catch (error: any) {
            message.error(error.message || "Failed to load dashboard data");
        } finally {
            setLoading(false);
        }
    };

    // Recent students columns
    const recentStudentColumns = [
        {
            title: 'Name',
            dataIndex: 'name',
            key: 'name',
            render: (text: string, record: any) => (
                <span>{text} <span className="text-xs text-gray-400">{record.email}</span></span>
            )
        },
        {
            title: 'College',
            dataIndex: 'college',
            key: 'college',
            width: 200,
        },
        {
            title: 'Skills',
            dataIndex: 'skills',
            key: 'skills',
            render: (count: number) => (
                <Tag icon={<CodeOutlined />} color={count > 5 ? 'green' : count > 2 ? 'blue' : 'default'}>
                    {count} skills
                </Tag>
            )
        },
        {
            title: 'Applied',
            dataIndex: 'applied',
            key: 'applied',
            width: 100,
            render: (date: string) => (
                <span><CalendarOutlined className="mr-1" />{new Date(date).toLocaleDateString()}</span>
            )
        }
    ];

    // Recent offers columns
    const recentOfferColumns = [
        {
            title: 'Candidate',
            dataIndex: 'name',
            key: 'name',
            render: (text: string, record: any) => (
                <span><UserOutlined className="mr-1" />{text}</span>
            )
        },
        {
            title: 'Status',
            dataIndex: 'status',
            key: 'status',
            render: (status: string) => {
                const color = {
                    'pending': 'processing',
                    'accepted': 'success',
                    'declined': 'error',
                    'expired': 'default'
                }[status] || 'default';

                const icon = {
                    'pending': <ClockCircleOutlined />,
                    'accepted': <CheckCircleOutlined />,
                    'declined': <CloseCircleOutlined />,
                    'expired': <CloseCircleOutlined />
                }[status];

                return <Tag icon={icon} color={color}>{status.toUpperCase()}</Tag>;
            }
        },
        {
            title: 'Sent',
            dataIndex: 'sentAt',
            key: 'sentAt',
            width: 150,
            render: (date: string) => (
                <span><MailOutlined className="mr-1" />{new Date(date).toLocaleDateString()}</span>
            )
        }
    ];

    // Define tab items using the new `items` syntax
    const tabItems = [
        {
            key: 'overview',
            label: <span><DashboardOutlined /> Overview</span>,
            children: (
                <>
                    {/* Charts Row 1 - Applications vs Offers */}
                    <Row gutter={[16, 16]} className="mt-4">
                        <Col xs={24} lg={12}>
                            <Card title={<span><LineChartOutlined /> Daily Applications</span>} className="shadow-sm">
                                <div style={{ height: 300 }}>
                                    <ResponsiveContainer width="100%" height="100%">
                                        <LineChart data={stats.dailyApplications}>
                                            <CartesianGrid strokeDasharray="3 3" />
                                            <XAxis dataKey="date" angle={-45} textAnchor="end" height={60} />
                                            <YAxis />
                                            <RechartsTooltip />
                                            <Legend />
                                            <Line type="monotone" dataKey="count" stroke="#1890ff" name="Applications" strokeWidth={2} />
                                        </LineChart>
                                    </ResponsiveContainer>
                                </div>
                            </Card>
                        </Col>

                        <Col xs={24} lg={12}>
                            <Card title={<span><BarChartOutlined /> Daily Offers Sent</span>} className="shadow-sm">
                                <div style={{ height: 300 }}>
                                    <ResponsiveContainer width="100%" height="100%">
                                        <LineChart data={stats.dailyOffers}>
                                            <CartesianGrid strokeDasharray="3 3" />
                                            <XAxis dataKey="date" angle={-45} textAnchor="end" height={60} />
                                            <YAxis />
                                            <RechartsTooltip />
                                            <Legend />
                                            <Line type="monotone" dataKey="count" stroke="#52c41a" name="Offers" strokeWidth={2} />
                                        </LineChart>
                                    </ResponsiveContainer>
                                </div>
                            </Card>
                        </Col>
                    </Row>

                    {/* Charts Row 2 - College and Skills */}
                    <Row gutter={[16, 16]} className="mt-4">
                        <Col xs={24} lg={12}>
                            <Card title={<span><ApartmentOutlined /> College Distribution</span>} className="shadow-sm">
                                <div style={{ height: 300 }}>
                                    <ResponsiveContainer width="100%" height="100%">
                                        <PieChart>
                                            <Pie
                                                data={stats.collegeData.slice(0, 5)}
                                                cx="50%"
                                                cy="50%"
                                                labelLine={true}
                                                label={(entry) => `${entry.name}: ${entry.value}`}
                                                outerRadius={80}
                                                dataKey="value"
                                            >
                                                {stats.collegeData.slice(0, 5).map((_, index) => (
                                                    <Cell key={`cell-${index}`} fill={COLORS.students[index % COLORS.students.length]} />
                                                ))}
                                            </Pie>
                                            <RechartsTooltip />
                                            <Legend />
                                        </PieChart>
                                    </ResponsiveContainer>
                                </div>
                            </Card>
                        </Col>

                        <Col xs={24} lg={12}>
                            <Card title={<span><CodeOutlined /> Top Skills</span>} className="shadow-sm">
                                <div style={{ height: 300 }}>
                                    <ResponsiveContainer width="100%" height="100%">
                                        <BarChart data={stats.skillData.slice(0, 8)} layout="vertical">
                                            <CartesianGrid strokeDasharray="3 3" />
                                            <XAxis type="number" />
                                            <YAxis dataKey="name" type="category" width={100} />
                                            <RechartsTooltip />
                                            <Bar dataKey="value" fill="#8884d8">
                                                {stats.skillData.slice(0, 8).map((_, index) => (
                                                    <Cell key={`cell-${index}`} fill={COLORS.students[index % COLORS.students.length]} />
                                                ))}
                                            </Bar>
                                        </BarChart>
                                    </ResponsiveContainer>
                                </div>
                            </Card>
                        </Col>
                    </Row>

                    {/* Charts Row 3 - Offer Status and Top Colleges */}
                    <Row gutter={[16, 16]} className="mt-4">
                        <Col xs={24} lg={12}>
                            <Card title={<span><PartitionOutlined /> Offer Status Distribution</span>} className="shadow-sm">
                                <div style={{ height: 300 }}>
                                    <ResponsiveContainer width="100%" height="100%">
                                        <PieChart>
                                            <Pie
                                                data={[
                                                    { name: 'Not Sent', value: stats.notSent },
                                                    { name: 'Pending', value: stats.pending },
                                                    { name: 'Accepted', value: stats.accepted },
                                                    { name: 'Declined', value: stats.declined },
                                                    { name: 'Expired', value: stats.expired },
                                                ].filter(item => item.value > 0)}
                                                cx="50%"
                                                cy="50%"
                                                labelLine={true}
                                                label={(entry) => `${entry.name}: ${entry.value}`}
                                                outerRadius={80}
                                                dataKey="value"
                                            >
                                                {[
                                                    { name: 'Not Sent', color: '#8c8c8c' },
                                                    { name: 'Pending', color: '#1890ff' },
                                                    { name: 'Accepted', color: '#52c41a' },
                                                    { name: 'Declined', color: '#f5222d' },
                                                    { name: 'Expired', color: '#faad14' },
                                                ].map((item, index) => (
                                                    <Cell key={`cell-${index}`} fill={item.color} />
                                                ))}
                                            </Pie>
                                            <RechartsTooltip />
                                            <Legend />
                                        </PieChart>
                                    </ResponsiveContainer>
                                </div>
                            </Card>
                        </Col>

                        <Col xs={24} lg={12}>
                            <Card title={<span><TrophyOutlined /> Top Colleges by Acceptance</span>} className="shadow-sm">
                                <div style={{ height: 300 }}>
                                    <ResponsiveContainer width="100%" height="100%">
                                        <BarChart data={stats.topCollegesByAcceptance.slice(0, 8)} layout="vertical">
                                            <CartesianGrid strokeDasharray="3 3" />
                                            <XAxis type="number" />
                                            <YAxis dataKey="name" type="category" width={150} />
                                            <RechartsTooltip />
                                            <Bar dataKey="value" fill="#1890ff" name="Accepted Offers" />
                                        </BarChart>
                                    </ResponsiveContainer>
                                </div>
                            </Card>
                        </Col>
                    </Row>
                </>
            )
        },
        {
            key: 'candidates',
            label: <span><TeamOutlined /> Candidates</span>,
            children: (
                <>
                    {/* Candidates specific stats */}
                    <Row gutter={[16, 16]} className="mt-4">
                        <Col xs={24} md={8}>
                            <Card>
                                <Statistic title="Year of Study" value={stats.yearData.length} prefix={<BookOutlined />} />
                                {stats.yearData.map(item => (
                                    <div key={item.name} className="flex justify-between mt-2">
                                        <span>{item.name}</span>
                                        <Tag color="blue">{item.value}</Tag>
                                    </div>
                                ))}
                            </Card>
                        </Col>

                        <Col xs={24} md={16}>
                            <Card title={<span><StarOutlined /> Domain Preferences</span>}>
                                <div style={{ height: 300 }}>
                                    <ResponsiveContainer width="100%" height="100%">
                                        <PieChart>
                                            <Pie
                                                data={stats.domainData}
                                                cx="50%"
                                                cy="50%"
                                                labelLine={true}
                                                label={(entry) => `${entry.name}: ${entry.value}`}
                                                outerRadius={100}
                                                dataKey="value"
                                            >
                                                {stats.domainData.map((_, index) => (
                                                    <Cell key={`cell-${index}`} fill={COLORS.students[index % COLORS.students.length]} />
                                                ))}
                                            </Pie>
                                            <RechartsTooltip />
                                            <Legend />
                                        </PieChart>
                                    </ResponsiveContainer>
                                </div>
                            </Card>
                        </Col>
                    </Row>

                    {/* Recent Candidates Table */}
                    <Card title={<span><UserOutlined /> Recent Candidates</span>} className="mt-4">
                        <Table
                            dataSource={stats.recentStudents}
                            columns={recentStudentColumns}
                            pagination={false}
                            size="small"
                        />
                    </Card>
                </>
            )
        },
        {
            key: 'offers',
            label: <span><MailOutlined /> Offers</span>,
            children: (
                <>
                    {/* Offers specific stats */}
                    <Row gutter={[16, 16]} className="mt-4">
                        <Col xs={24} md={8}>
                            <Card>
                                <Statistic title="Total Offers" value={stats.totalOffers} prefix={<SendOutlined />} />
                                <div className="mt-4">
                                    <div className="flex justify-between">
                                        <span>Not Sent</span>
                                        <Tag color="default">{stats.notSent}</Tag>
                                    </div>
                                    <div className="flex justify-between mt-2">
                                        <span>Pending</span>
                                        <Tag color="processing">{stats.pending}</Tag>
                                    </div>
                                    <div className="flex justify-between mt-2">
                                        <span>Accepted</span>
                                        <Tag color="success">{stats.accepted}</Tag>
                                    </div>
                                    <div className="flex justify-between mt-2">
                                        <span>Declined</span>
                                        <Tag color="error">{stats.declined}</Tag>
                                    </div>
                                    <div className="flex justify-between mt-2">
                                        <span>Expired</span>
                                        <Tag color="default">{stats.expired}</Tag>
                                    </div>
                                </div>
                            </Card>
                        </Col>

                        <Col xs={24} md={16}>
                            <Card title={<span><LineChartOutlined /> Daily Offer Trend</span>}>
                                <div style={{ height: 300 }}>
                                    <ResponsiveContainer width="100%" height="100%">
                                        <LineChart data={stats.dailyOffers}>
                                            <CartesianGrid strokeDasharray="3 3" />
                                            <XAxis dataKey="date" />
                                            <YAxis />
                                            <RechartsTooltip />
                                            <Legend />
                                            <Line type="monotone" dataKey="count" stroke="#1890ff" name="Offers Sent" />
                                        </LineChart>
                                    </ResponsiveContainer>
                                </div>
                            </Card>
                        </Col>
                    </Row>

                    {/* Recent Offers Table */}
                    <Card title={<span><MailOutlined /> Recent Offers</span>} className="mt-4">
                        <Table
                            dataSource={stats.recentOffers}
                            columns={recentOfferColumns}
                            pagination={false}
                            size="small"
                        />
                    </Card>
                </>
            )
        }
    ];

    if (loading) {
        return (
            <div className="h-screen flex items-center justify-center">
                <Spin indicator={<LoadingOutlined style={{ fontSize: 48 }} spin />} />
            </div>
        );
    }

    return (
        <div className="h-[600px] overflow-hidden border flex flex-col">
            {/* Scrollable content area */}
            <div className="flex-1 overflow-y-auto hide-scrollbar">
                <div className="p-6 space-y-6">
                    {/* Header */}
                    <div className="flex justify-between items-center">
                        <h1 className="text-2xl font-bold"><DashboardOutlined className="mr-2" />Dashboard Overview</h1>
                        <div className="text-sm text-gray-400">
                            <CalendarOutlined className="mr-1" /> Last updated: {new Date().toLocaleString()}
                        </div>
                    </div>

                    {/* Key Metrics Cards - Combined */}
                    <Row gutter={[16, 16]}>
                        <Col xs={24} sm={12} md={6}>
                            <Card className="shadow-sm hover:shadow-md transition-shadow">
                                <Statistic
                                    title="Total Candidates"
                                    value={stats.totalStudents}
                                    prefix={<UserOutlined className="text-blue-500" />}
                                    styles={{ content: { color: '#1890ff', fontSize: '32px' } }}
                                />
                                <div className="text-xs text-gray-400 mt-2">
                                    <ApartmentOutlined className="mr-1" />{stats.uniqueColleges} colleges · <CodeOutlined className="mr-1" />{stats.uniqueSkills} skills
                                </div>
                            </Card>
                        </Col>

                        <Col xs={24} sm={12} md={6}>
                            <Card className="shadow-sm hover:shadow-md transition-shadow">
                                <Statistic
                                    title="Offers Sent"
                                    value={stats.totalOffers}
                                    prefix={<SendOutlined className="text-green-500" />}
                                    styles={{ content: { color: '#52c41a', fontSize: '32px' } }}
                                />
                                <div className="text-xs text-gray-400 mt-2">
                                    <ClockCircleOutlined className="mr-1" />{stats.notSent} candidates pending
                                </div>
                            </Card>
                        </Col>

                        <Col xs={24} sm={12} md={6}>
                            <Card className="shadow-sm hover:shadow-md transition-shadow">
                                <Statistic
                                    title="Accepted"
                                    value={stats.accepted}
                                    prefix={<CheckCircleOutlined className="text-green-500" />}
                                    styles={{ content: { color: '#52c41a', fontSize: '32px' } }}
                                />
                                <div className="text-xs text-gray-400 mt-2">
                                    <CloseCircleOutlined className="mr-1" />{stats.declined} declined · <ClockCircleOutlined className="mr-1" />{stats.pending} pending
                                </div>
                            </Card>
                        </Col>

                        <Col xs={24} sm={12} md={6}>
                            <Card className="shadow-sm hover:shadow-md transition-shadow">
                                <Statistic
                                    title="Response Rate"
                                    value={stats.responseRate}
                                    suffix="%"
                                    prefix={<RiseOutlined className="text-purple-500" />}
                                    styles={{ content: { color: '#722ed1', fontSize: '32px' } }}
                                />
                                <div className="text-xs text-gray-400 mt-2">
                                    <CloseCircleOutlined className="mr-1" />{stats.expired} offers expired
                                </div>
                            </Card>
                        </Col>
                    </Row>

                    {/* Tabs for different views - Using items prop */}
                    <Tabs
                        activeKey={activeTab}
                        onChange={setActiveTab}
                        type="card"
                        items={tabItems}
                    />
                </div>
            </div>
        </div>
    );
}