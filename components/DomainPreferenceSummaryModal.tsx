"use client";

import { Modal, Typography, Card, Row, Col, Statistic, Table, Tag, Spin, Tabs, Progress, Empty, Tooltip, Badge, Button } from "antd";
import { useState, useEffect } from "react";
import type { ColumnsType } from "antd/es/table";
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip,
    PieChart, Pie, Cell, LineChart, Line, Legend, ResponsiveContainer,
    Area, AreaChart
} from 'recharts';
import {
    PieChartOutlined,
    RiseOutlined,
    TeamOutlined,
    BulbOutlined,
    DatabaseOutlined,
    CalendarOutlined,
    TrophyOutlined,
    RocketOutlined,
    ExperimentOutlined,
    CodeOutlined
} from '@ant-design/icons';

const { Title, Text } = Typography;

// Color palette for charts
const COLORS = [
    '#4361ee', '#3a0ca3', '#7209b7', '#f72585', '#4cc9f0',
    '#f8961e', '#f94144', '#577590', '#43aa8b', '#ef476f',
    '#ffd166', '#06d6a0', '#118ab2', '#073b4c', '#fb5607'
];

// Skill level colors
const SKILL_LEVEL_COLORS = {
    'Beginner': '#4cc9f0',
    'Intermediate': '#f8961e',
    'Advanced': '#f72585',
    'Expert': '#7209b7'
};

interface SummaryData {
    total: number;
    domainStats: Record<string, number>;
    collegeStats: Record<string, number>;
    skillLevelStats: Record<string, number>;
    skillLevelByDomain: Record<string, Record<string, number>>;
    technologyStats: Record<string, number>;
    monthlyStats: Record<string, number>;
}

interface DomainPreferenceSummaryModalProps {
    visible: boolean;
    onClose: () => void;
}

export default function DomainPreferenceSummaryModal({ visible, onClose }: DomainPreferenceSummaryModalProps) {
    const [summaryData, setSummaryData] = useState<SummaryData | null>(null);
    const [loading, setLoading] = useState(false);
    const [activeTab, setActiveTab] = useState('overview');

    useEffect(() => {
        if (visible) {
            fetchSummaryData();
        }
    }, [visible]);

    const fetchSummaryData = async () => {
        try {
            setLoading(true);
            const response = await fetch('/api/domain-preferences/summary');
            const data = await response.json();

            if (data.success) {
                setSummaryData(data.summary);
            }
        } catch (error) {
            console.error('Error fetching summary:', error);
        } finally {
            setLoading(false);
        }
    };

    // Prepare data for display
    const domainChartData = Object.entries(summaryData?.domainStats || {}).map(([domain, count]) => ({
        name: domain.length > 30 ? domain.substring(0, 30) + '...' : domain,
        fullName: domain,
        value: count,
        percentage: ((count / (summaryData?.total || 1)) * 100)
    })).sort((a, b) => b.value - a.value);

    const collegeChartData = Object.entries(summaryData?.collegeStats || {})
        .sort(([, a], [, b]) => b - a)
        .slice(0, 10)
        .map(([college, count]) => ({
            name: college.length > 40 ? college.substring(0, 40) + '...' : college,
            fullName: college,
            value: count
        }));

    const skillLevelData = Object.entries(summaryData?.skillLevelStats || {}).map(([level, count]) => ({
        name: level,
        value: count,
        color: SKILL_LEVEL_COLORS[level as keyof typeof SKILL_LEVEL_COLORS] || '#4361ee'
    }));

    const technologyChartData = Object.entries(summaryData?.technologyStats || {})
        .sort(([, a], [, b]) => b - a)
        .slice(0, 15)
        .map(([tech, count]) => ({
            name: tech,
            value: count
        }));

    const monthlyChartData = Object.entries(summaryData?.monthlyStats || {})
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([month, count]) => ({
            month,
            count,
            monthDisplay: new Date(month + '-01').toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
            fullDate: new Date(month + '-01')
        }));

    // Calculate insights
    const topDomain = domainChartData[0];
    const topCollege = collegeChartData[0];
    const topTechnology = technologyChartData[0];
    const totalUniqueDomains = Object.keys(summaryData?.domainStats || {}).length;
    const totalUniqueColleges = Object.keys(summaryData?.collegeStats || {}).length;
    const totalUniqueTechnologies = Object.keys(summaryData?.technologyStats || {}).length;

    // Table columns
    const domainColumns: ColumnsType<typeof domainChartData[0]> = [
        {
            title: "Domain",
            dataIndex: "name",
            key: "domain",
            render: (_, record) => (
                <Tooltip title={record.fullName}>
                    <span>{record.name}</span>
                </Tooltip>
            ),
        },
        {
            title: "Count",
            dataIndex: "value",
            key: "count",
            sorter: (a, b) => a.value - b.value,
            render: (value) => <Badge count={value} showZero color="#4361ee" />
        },
        {
            title: "Percentage",
            dataIndex: "percentage",
            key: "percentage",
            render: (percentage) => (
                <Progress
                    percent={Number(percentage.toFixed(1))}
                    size="small"
                    showInfo={false}
                    strokeColor="#4361ee"
                />
            ),
        },
        {
            title: "Value",
            key: "percentageValue",
            render: (_, record) => (
                <Text strong>{record.percentage.toFixed(1)}%</Text>
            ),
        },
    ];

    const collegeColumns: ColumnsType<typeof collegeChartData[0]> = [
        {
            title: "College",
            dataIndex: "name",
            key: "college",
            render: (_, record) => (
                <Tooltip title={record.fullName}>
                    <span>{record.name}</span>
                </Tooltip>
            ),
        },
        {
            title: "Applications",
            dataIndex: "value",
            key: "count",
            sorter: (a, b) => a.value - b.value,
            render: (value) => (
                <Tag color="#52c41a" className="font-medium">
                    {value}
                </Tag>
            ),
        },
    ];

    const technologyColumns: ColumnsType<typeof technologyChartData[0]> = [
        {
            title: "Technology",
            dataIndex: "name",
            key: "technology",
            width: 250,
            ellipsis: true,
            render: (tech) => (
                <Tooltip title={tech} placement="topLeft">
                    <Tag color="blue" className="px-3 py-1 inline-flex items-center">
                        <CodeOutlined className="mr-1 flex-shrink-0" />
                        <span className="truncate">{tech}</span>
                    </Tag>
                </Tooltip>
            ),
        },
        {
            title: "Frequency",
            dataIndex: "value",
            key: "count",
            sorter: (a, b) => a.value - b.value,
            render: (value) => (
                <Progress
                    percent={Math.round((value / technologyChartData[0]?.value) * 100)}
                    size="small"
                    format={() => `${value}`}
                    strokeColor="#722ed1"
                />
            ),
        },
    ];

    // Custom card component
    const StatCard = ({ title, value, icon, color, subtitle }: any) => (
        <Card className="hover:shadow-lg transition-shadow duration-300">
            <div className="flex items-center justify-between">
                <div>
                    <Text type="secondary" className="text-sm">{title}</Text>
                    <div className="text-2xl font-bold mt-1" style={{ color }}>
                        {value.toLocaleString()}
                    </div>
                    {subtitle && <Text type="secondary" className="text-xs">{subtitle}</Text>}
                </div>
                <div className="text-3xl opacity-20" style={{ color }}>
                    {icon}
                </div>
            </div>
        </Card>
    );

    // Insight card component
    const InsightCard = ({ icon, title, value, description, color }: any) => (
        <Card className="bg-gradient-to-r from-gray-50 to-white border-gray-100">
            <div className="flex items-start gap-4">
                <div className="p-3 rounded-lg" style={{ backgroundColor: color + '20' }}>
                    <span style={{ color }} className="text-xl">{icon}</span>
                </div>
                <div>
                    <Text type="secondary" className="text-xs uppercase tracking-wider">
                        {title}
                    </Text>
                    <div className="text-lg font-semibold mt-1">{value}</div>
                    <Text type="secondary" className="text-xs mt-1 block">
                        {description}
                    </Text>
                </div>
            </div>
        </Card>
    );

    return (
        <Modal
            title={
                <div className="flex items-center gap-3">
                    <PieChartOutlined className="text-2xl text-blue-600" />
                    <div>
                        <Title level={4} className="!mb-0">Domain Preferences Analytics</Title>
                        <Text type="secondary">Comprehensive overview of all domain applications</Text>
                    </div>
                </div>
            }
            open={visible}
            onCancel={onClose}
            footer={null}
            width="95%"
            centered
            className="domain-preference-modal"
            styles={{
                body: {
                    padding: '24px',
                    maxHeight: 'calc(100vh - 150px)',
                    overflowY: 'auto',
                    background: '#f8fafc'
                },
            }}
            style={{
                top: 0, // Adjust top position if needed
                maxWidth: '1400px' // Optional: set a max width for very large screens
            }}
        >
            {loading ? (
                <div className="flex flex-col justify-center items-center h-96 gap-4">
                    <Spin size="large" />
                    <Text type="secondary">Loading analytics data...</Text>
                </div>
            ) : summaryData ? (
                <div className="space-y-6">
                    {/* Key Insights Section */}
                    <Row gutter={[16, 16]}>
                        <Col span={24}>
                            <Card className="bg-white shadow-xs border-0">
                                <div className="flex items-center justify-between mb-6">
                                    <div>
                                        <Title level={4} className="!mb-1 text-gray-800">Quick Insights</Title>
                                        <Text type="secondary">Based on {summaryData.total} total applications</Text>
                                    </div>
                                    <div className="bg-blue-50 p-3 rounded-xl">
                                        <RocketOutlined className="text-blue-600 text-xl" />
                                    </div>
                                </div>

                                <Row gutter={[16, 16]}>
                                    <Col span={8}>
                                        <div className="border border-gray-100 rounded-xl p-5 hover:shadow-md transition-shadow">
                                            <div className="flex items-center gap-2 mb-3">
                                                <div className="w-8 h-8 bg-blue-50 rounded-lg flex items-center justify-center">
                                                    <span className="text-blue-600 text-lg">🏆</span>
                                                </div>
                                                <Text type="secondary" className="text-sm">Most Popular</Text>
                                            </div>
                                            <Text strong className="text-xl text-gray-800 block truncate" title={topDomain?.fullName}>
                                                {topDomain?.fullName || 'N/A'}
                                            </Text>
                                            <div className="flex items-center justify-between mt-3">
                                                <Text type="secondary" className="text-sm">{topDomain?.value} applications</Text>
                                                <Text strong className="text-blue-600">{topDomain?.percentage.toFixed(1)}%</Text>
                                            </div>
                                        </div>
                                    </Col>

                                    <Col span={8}>
                                        <div className="border border-gray-100 rounded-xl p-5 hover:shadow-md transition-shadow">
                                            <div className="flex items-center gap-2 mb-3">
                                                <div className="w-8 h-8 bg-green-50 rounded-lg flex items-center justify-center">
                                                    <span className="text-green-600 text-lg">🎓</span>
                                                </div>
                                                <Text type="secondary" className="text-sm">Top College</Text>
                                            </div>
                                            <Text strong className="text-xl text-gray-800 block truncate" title={topCollege?.fullName}>
                                                {topCollege?.fullName || 'N/A'}
                                            </Text>
                                            <div className="flex items-center justify-between mt-3">
                                                <Text type="secondary" className="text-sm">Applications</Text>
                                                <Text strong className="text-green-600">{topCollege?.value}</Text>
                                            </div>
                                        </div>
                                    </Col>

                                    <Col span={8}>
                                        <div className="border border-gray-100 rounded-xl p-5 hover:shadow-md transition-shadow">
                                            <div className="flex items-center gap-2 mb-3">
                                                <div className="w-8 h-8 bg-purple-50 rounded-lg flex items-center justify-center">
                                                    <span className="text-purple-600 text-lg">💻</span>
                                                </div>
                                                <Text type="secondary" className="text-sm">Top Technology</Text>
                                            </div>
                                            <Text strong className="text-xl text-gray-800 block">
                                                {topTechnology?.name || 'N/A'}
                                            </Text>
                                            <div className="flex items-center justify-between mt-3">
                                                <Text type="secondary" className="text-sm">Total mentions</Text>
                                                <div className="flex items-center gap-1">
                                                    <RiseOutlined className="text-green-500 text-sm" />
                                                    <Text strong className="text-purple-600">{topTechnology?.value}</Text>
                                                </div>
                                            </div>
                                        </div>
                                    </Col>
                                </Row>
                            </Card>
                        </Col>
                    </Row>

                    {/* Statistics Cards */}
                    <Row gutter={[16, 16]}>
                        <Col xs={24} sm={12} md={6}>
                            <StatCard
                                title="Total Applications"
                                value={summaryData.total}
                                icon={<DatabaseOutlined />}
                                color="#4361ee"
                                subtitle="Across all domains"
                            />
                        </Col>
                        <Col xs={24} sm={12} md={6}>
                            <StatCard
                                title="Unique Domains"
                                value={totalUniqueDomains}
                                icon={<ExperimentOutlined />}
                                color="#3a0ca3"
                                subtitle="Different domains"
                            />
                        </Col>
                        <Col xs={24} sm={12} md={6}>
                            <StatCard
                                title="Participating Colleges"
                                value={totalUniqueColleges}
                                icon={<TeamOutlined />}
                                color="#7209b7"
                                subtitle="Unique institutions"
                            />
                        </Col>
                        <Col xs={24} sm={12} md={6}>
                            <StatCard
                                title="Technologies"
                                value={totalUniqueTechnologies}
                                icon={<CodeOutlined />}
                                color="#f72585"
                                subtitle="Different tech stacks"
                            />
                        </Col>
                    </Row>

                    {/* Tabs for different views */}
                    <Card className="overflow-hidden">
                        <Tabs
                            activeKey={activeTab}
                            onChange={setActiveTab}
                            size="large"
                            items={[
                                {
                                    key: 'overview',
                                    label: <span><PieChartOutlined /> Distribution</span>,
                                    children: (
                                        <Row gutter={[16, 16]}>
                                            <Col xs={24} lg={12}>
                                                <Card title="Domain Distribution" className="h-full">
                                                    <ResponsiveContainer width="100%" height={300}>
                                                        <PieChart>
                                                            <Pie
                                                                data={domainChartData.slice(0, 8)}
                                                                cx="50%"
                                                                cy="50%"
                                                                innerRadius={60}
                                                                outerRadius={100}
                                                                paddingAngle={2}
                                                                dataKey="value"
                                                                label={({ name, percent }) => `${name} (${((percent || 0) * 100).toFixed(0)}%)`}
                                                                labelLine={{ stroke: '#ccc', strokeWidth: 1 }}
                                                            >
                                                                {domainChartData.slice(0, 8).map((entry, index) => (
                                                                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                                                ))}
                                                            </Pie>
                                                            <RechartsTooltip />
                                                        </PieChart>
                                                    </ResponsiveContainer>
                                                    {domainChartData.length > 8 && (
                                                        <Text type="secondary" className="block text-center mt-2">
                                                            +{domainChartData.length - 8} more domains not shown
                                                        </Text>
                                                    )}
                                                </Card>
                                            </Col>
                                            <Col xs={24} lg={12}>
                                                <Card title="Domain Rankings" className="h-full">
                                                    <Table
                                                        columns={domainColumns}
                                                        dataSource={domainChartData.slice(0, 10)}
                                                        size="middle"
                                                        pagination={false}
                                                        scroll={{ y: 250 }}
                                                        rowKey="fullName"
                                                        className="custom-table"
                                                    />
                                                </Card>
                                            </Col>
                                        </Row>
                                    )
                                },
                                {
                                    key: 'colleges',
                                    label: <span><TeamOutlined /> Colleges</span>,
                                    children: (
                                        <Row gutter={[16, 16]}>
                                            <Col xs={24} lg={16}>
                                                <Card title="College Contribution" className="h-full">
                                                    <ResponsiveContainer width="100%" height={400}>
                                                        <BarChart data={collegeChartData}>
                                                            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                                                            <XAxis
                                                                dataKey="name"
                                                                angle={-45}
                                                                textAnchor="end"
                                                                height={100}
                                                                interval={0}
                                                                tick={{ fontSize: 11 }}
                                                            />
                                                            <YAxis />
                                                            <RechartsTooltip />
                                                            <Bar
                                                                dataKey="value"
                                                                fill="#52c41a"
                                                                radius={[4, 4, 0, 0]}
                                                            />
                                                        </BarChart>
                                                    </ResponsiveContainer>
                                                </Card>
                                            </Col>
                                            <Col xs={24} lg={8}>
                                                <Card title="College Details" className="h-full">
                                                    <Table
                                                        columns={collegeColumns}
                                                        dataSource={collegeChartData}
                                                        size="small"
                                                        pagination={false}
                                                        scroll={{ y: 350 }}
                                                        rowKey="fullName"
                                                    />
                                                </Card>
                                            </Col>
                                        </Row>
                                    )
                                },
                                {
                                    key: 'trends',
                                    label: <span><RiseOutlined /> Trends</span>,
                                    children: (
                                        <Row gutter={[16, 16]}>
                                            <Col span={24}>
                                                <Card title="Monthly Application Trends">
                                                    <ResponsiveContainer width="100%" height={300}>
                                                        <AreaChart data={monthlyChartData}>
                                                            <defs>
                                                                <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
                                                                    <stop offset="5%" stopColor="#4361ee" stopOpacity={0.8} />
                                                                    <stop offset="95%" stopColor="#4361ee" stopOpacity={0.1} />
                                                                </linearGradient>
                                                            </defs>
                                                            <CartesianGrid strokeDasharray="3 3" />
                                                            <XAxis dataKey="monthDisplay" />
                                                            <YAxis />
                                                            <RechartsTooltip />
                                                            <Area
                                                                type="monotone"
                                                                dataKey="count"
                                                                stroke="#4361ee"
                                                                fillOpacity={1}
                                                                fill="url(#colorCount)"
                                                            />
                                                        </AreaChart>
                                                    </ResponsiveContainer>
                                                </Card>
                                            </Col>
                                        </Row>
                                    )
                                },
                                {
                                    key: 'technologies',
                                    label: <span><BulbOutlined /> Technologies</span>,
                                    children: (
                                        <Row gutter={[16, 16]}>
                                            <Col xs={24} lg={16}>
                                                <Card title="Technology Popularity">
                                                    <ResponsiveContainer width="100%" height={400}>
                                                        <BarChart data={technologyChartData.slice(0, 10)} layout="vertical">
                                                            <CartesianGrid strokeDasharray="3 3" />
                                                            <XAxis type="number" />
                                                            <YAxis
                                                                type="category"
                                                                dataKey="name"
                                                                width={100}
                                                                tick={{ fontSize: 11 }}
                                                            />
                                                            <RechartsTooltip />
                                                            <Bar
                                                                dataKey="value"
                                                                fill="#722ed1"
                                                                radius={[0, 4, 4, 0]}
                                                            />
                                                        </BarChart>
                                                    </ResponsiveContainer>
                                                </Card>
                                            </Col>
                                            <Col xs={24} lg={8}>
                                                <Card title="Technology Details">
                                                    <Table
                                                        columns={technologyColumns}
                                                        dataSource={technologyChartData.slice(0, 10)}
                                                        size="small"
                                                        pagination={false}
                                                        scroll={{ y: 350 }}
                                                        rowKey="name"
                                                    />
                                                </Card>
                                            </Col>
                                        </Row>
                                    )
                                },
                                {
                                    key: 'skills',
                                    label: <span><TrophyOutlined /> Skills</span>,
                                    children: (
                                        <Row gutter={[16, 16]}>
                                            <Col xs={24} lg={8}>
                                                <Card title="Overall Skill Distribution">
                                                    <ResponsiveContainer width="100%" height={300}>
                                                        <PieChart>
                                                            <Pie
                                                                data={skillLevelData}
                                                                cx="50%"
                                                                cy="50%"
                                                                innerRadius={60}
                                                                outerRadius={90}
                                                                paddingAngle={4}
                                                                dataKey="value"
                                                                label={({ name, percent }) => `${name} (${((percent || 0) * 100).toFixed(0)}%)`}
                                                            >
                                                                {skillLevelData.map((entry, index) => (
                                                                    <Cell key={`cell-${index}`} fill={entry.color} />
                                                                ))}
                                                            </Pie>
                                                            <RechartsTooltip />
                                                        </PieChart>
                                                    </ResponsiveContainer>
                                                </Card>
                                            </Col>
                                            <Col xs={24} lg={16}>
                                                <Card title="Skill Levels by Domain">
                                                    <Row gutter={[12, 12]}>
                                                        {Object.entries(summaryData.skillLevelByDomain || {}).slice(0, 4).map(([domain, levels]) => (
                                                            <Col span={12} key={domain}>
                                                                <Card size="small" className="skill-domain-card">
                                                                    <Text strong className="block mb-2">
                                                                        {domain.length > 20 ? domain.substring(0, 20) + '...' : domain}
                                                                    </Text>
                                                                    {Object.entries(levels).map(([level, count]) => (
                                                                        <div key={level} className="flex items-center justify-between mb-1">
                                                                            <Text type="secondary" style={{ fontSize: 11 }}>{level}</Text>
                                                                            <Badge
                                                                                count={count}
                                                                                style={{
                                                                                    backgroundColor: SKILL_LEVEL_COLORS[level as keyof typeof SKILL_LEVEL_COLORS],
                                                                                    fontSize: 10
                                                                                }}
                                                                            />
                                                                        </div>
                                                                    ))}
                                                                </Card>
                                                            </Col>
                                                        ))}
                                                    </Row>
                                                </Card>
                                            </Col>
                                        </Row>
                                    )
                                }
                            ]}
                        />
                    </Card>
                </div>
            ) : (
                <div className="text-center py-16 bg-gray-50 rounded-lg">
                    <Empty
                        description="No data available"
                        image={Empty.PRESENTED_IMAGE_SIMPLE}
                    />
                    <Button type="primary" className="mt-4" onClick={fetchSummaryData}>
                        Retry
                    </Button>
                </div>
            )}

            <style jsx>{`
                .domain-preference-modal :global(.ant-modal-content) {
                    border-radius: 16px;
                    overflow: hidden;
                }
                
                .domain-preference-modal :global(.ant-modal-header) {
                    border-bottom: 1px solid #f0f0f0;
                    padding: 20px 24px;
                }
                
                .domain-preference-modal :global(.ant-card) {
                    border-radius: 12px;
                    box-shadow: 0 2px 8px rgba(0,0,0,0.04);
                }
                
                .domain-preference-modal :global(.ant-tabs-nav) {
                    padding: 0 16px;
                    margin-bottom: 16px;
                }
                
                .domain-preference-modal :global(.ant-tabs-tab) {
                    padding: 12px 16px;
                    transition: all 0.3s;
                }
                
                .domain-preference-modal :global(.ant-tabs-tab:hover) {
                    color: #4361ee;
                }
                
                .domain-preference-modal :global(.ant-table) {
                    border-radius: 8px;
                }
                
                .skill-domain-card {
                    background: linear-gradient(135deg, #f8f9fa 0%, #ffffff 100%);
                    border: 1px solid #e9ecef;
                }
                
                .skill-domain-card:hover {
                    box-shadow: 0 4px 12px rgba(0,0,0,0.05);
                }
            `}</style>
        </Modal>
    );
}