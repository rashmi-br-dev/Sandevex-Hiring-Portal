"use client";

import { Modal, Button, Card, Row, Col, Statistic, Tooltip, Table, Tag, Spin } from "antd";
import {
    PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis,
    CartesianGrid, Tooltip as RechartsTooltip, Legend,
    ResponsiveContainer, LineChart, Line
} from 'recharts';
import {
    UserOutlined, TeamOutlined, CalendarOutlined,
    RiseOutlined, FundOutlined, LoadingOutlined
} from "@ant-design/icons";
import { useEffect, useState } from "react";

interface SummaryModalProps {
    visible: boolean;
    onClose: () => void;
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82CA9D', '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4'];

export default function SummaryModal({ visible, onClose }: SummaryModalProps) {
    const [loading, setLoading] = useState(false);
    const [students, setStudents] = useState<any[]>([]);

    // Fetch all students when modal opens
    useEffect(() => {
        if (visible) {
            fetchAllStudents();
        }
    }, [visible]);

    const fetchAllStudents = async () => {
        try {
            setLoading(true);
            const res = await fetch('/api/students/summary');
            const data = await res.json();
            setStudents(data.students || []);
        } catch (error) {
            console.error("Failed to fetch students:", error);
        } finally {
            setLoading(false);
        }
    };

    // Calculate statistics for ALL students
    const getStats = () => {
        const collegeCount: Record<string, number> = {};
        const skillCount: Record<string, number> = {};
        const dailyJoins: Record<string, number> = {};
        const domainCount: Record<string, number> = {};
        const yearOfStudyCount: Record<string, number> = {};

        let totalSkills = 0;
        let studentsWithSkills = 0;

        students.forEach(student => {
            // College counts
            if (student.collegeName) {
                collegeCount[student.collegeName] = (collegeCount[student.collegeName] || 0) + 1;
            }

            // Domain counts
            if (student.preferredDomain) {
                domainCount[student.preferredDomain] = (domainCount[student.preferredDomain] || 0) + 1;
            }

            // Year of study counts
            if (student.yearOfStudy) {
                yearOfStudyCount[student.yearOfStudy] = (yearOfStudyCount[student.yearOfStudy] || 0) + 1;
            }

            // Skill counts
            if (student.technicalSkills && Array.isArray(student.technicalSkills)) {
                studentsWithSkills++;
                totalSkills += student.technicalSkills.length;

                student.technicalSkills.forEach((skill: string) => {
                    if (skill && skill.trim()) {
                        skillCount[skill] = (skillCount[skill] || 0) + 1;
                    }
                });
            }

            // Daily joins
            if (student.createdAt) {
                const date = new Date(student.createdAt).toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric'
                });
                dailyJoins[date] = (dailyJoins[date] || 0) + 1;
            }
        });

        // Convert to array format for charts
        const collegeData = Object.entries(collegeCount)
            .map(([name, value]) => ({ name, value }))
            .sort((a, b) => b.value - a.value);

        const skillData = Object.entries(skillCount)
            .map(([name, value]) => ({ name, value }))
            .sort((a, b) => b.value - a.value)
            .slice(0, 15); // Top 15 skills

        const domainData = Object.entries(domainCount)
            .map(([name, value]) => ({ name, value }))
            .sort((a, b) => b.value - a.value);

        const yearData = Object.entries(yearOfStudyCount)
            .map(([name, value]) => ({ name, value }))
            .sort((a, b) => b.value - a.value);

        const dailyData = Object.entries(dailyJoins)
            .map(([date, count]) => ({ date, count }))
            .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

        const avgSkillsPerStudent = studentsWithSkills > 0
            ? (totalSkills / studentsWithSkills).toFixed(1)
            : 0;

        return {
            total: students.length,
            collegeData,
            skillData,
            domainData,
            yearData,
            dailyData,
            avgSkillsPerStudent,
            studentsWithSkills,
            totalSkills
        };
    };

    const stats = getStats();

    // Recent students for table (from ALL students)
    const recentStudents = students.slice(0, 10).map(student => ({
        key: student._id,
        name: student.fullName,
        email: student.email,
        college: student.collegeName,
        skills: student.technicalSkills?.length || 0,
        applied: new Date(student.createdAt).toLocaleDateString()
    }));

    const recentColumns = [
        {
            title: 'Name',
            dataIndex: 'name',
            key: 'name',
            render: (text: string, record: any) => (
                <Tooltip title={record.email}>
                    <span className="cursor-help">{text}</span>
                </Tooltip>
            )
        },
        {
            title: 'College',
            dataIndex: 'college',
            key: 'college',
            render: (text: string) => (
                <Tooltip title="Click to filter by this college">
                    <span className="cursor-help">{text || '-'}</span>
                </Tooltip>
            )
        },
        {
            title: 'Skills',
            dataIndex: 'skills',
            key: 'skills',
            render: (count: number) => (
                <Tag color={count > 5 ? 'green' : count > 2 ? 'blue' : 'default'}>
                    {count} skills
                </Tag>
            )
        },
        {
            title: 'Applied',
            dataIndex: 'applied',
            key: 'applied',
        }
    ];

    return (
        <Modal
            title={
                <div className="flex items-center gap-1">
                    <FundOutlined className="text-blue-500" />
                    <span>Candidates Summary Dashboard</span>
                </div>
            }
            open={visible}
            onCancel={onClose}
            centered
            footer={[
                <Button key="close" onClick={onClose} type="primary">
                    Close
                </Button>
            ]}
            width={1200}
            styles={{
                body: {
                    maxHeight: '75vh',
                    overflowY: 'auto',
                    padding: '20px'
                },
                mask: {
                    backdropFilter: 'blur(4px)'
                }
            }}
        >
            {loading ? (
                <div className="flex justify-center items-center py-20">
                    <Spin indicator={<LoadingOutlined style={{ fontSize: 48 }} spin />} />
                </div>
            ) : (
                <div className="space-y-8">
                    {/* Statistics Cards - Fixed deprecated valueStyle */}
                    <Row gutter={[16, 16]}>
                        <Col xs={24} sm={12} md={6}>
                            <Tooltip title="Total number of candidates in the system">
                                <Card hoverable>
                                    <Statistic
                                        title="Total Candidates"
                                        value={stats.total}
                                        prefix={<UserOutlined />}
                                        styles={{
                                            content: {
                                                color: '#3f8600',
                                                fontSize: '28px',
                                                fontWeight: 'bold'
                                            }
                                        }}
                                    />
                                </Card>
                            </Tooltip>
                        </Col>
                        <Col xs={24} sm={12} md={6}>
                            <Tooltip title="Number of unique colleges represented">
                                <Card hoverable>
                                    <Statistic
                                        title="Unique Colleges"
                                        value={stats.collegeData.length}
                                        prefix={<TeamOutlined />}
                                        styles={{
                                            content: {
                                                color: '#1890ff',
                                                fontSize: '28px',
                                                fontWeight: 'bold'
                                            }
                                        }}
                                    />
                                </Card>
                            </Tooltip>
                        </Col>
                        <Col xs={24} sm={12} md={6}>
                            <Tooltip title="Total unique skills across all candidates">
                                <Card hoverable>
                                    <Statistic
                                        title="Unique Skills"
                                        value={stats.skillData.length}
                                        prefix={<RiseOutlined />}
                                        styles={{
                                            content: {
                                                color: '#722ed1',
                                                fontSize: '28px',
                                                fontWeight: 'bold'
                                            }
                                        }}
                                    />
                                </Card>
                            </Tooltip>
                        </Col>
                        <Col xs={24} sm={12} md={6}>
                            <Tooltip title="Average skills per candidate">
                                <Card hoverable>
                                    <Statistic
                                        title="Avg Skills/Candidate"
                                        value={stats.avgSkillsPerStudent}
                                        suffix="skills"
                                        styles={{
                                            content: {
                                                color: '#eb2f96',
                                                fontSize: '28px',
                                                fontWeight: 'bold'
                                            }
                                        }}
                                    />
                                </Card>
                            </Tooltip>
                        </Col>
                    </Row>

                    {/* Charts Row 1 - College Distribution and Top Skills */}
                    <Row gutter={[16, 16]}>
                        <Col xs={24} lg={12}>
                            <Tooltip title="Distribution of candidates across different colleges">
                                <Card title="🎓 College Distribution" className="shadow-sm">
                                    <div style={{ width: '100%', height: 300 }}>
                                        <ResponsiveContainer>
                                            <PieChart>
                                                <Pie
                                                    data={stats.collegeData}
                                                    cx="50%"
                                                    cy="50%"
                                                    labelLine={true}
                                                    label={(entry) => `${entry.name}: ${entry.value}`}
                                                    outerRadius={80}
                                                    fill="#8884d8"
                                                    dataKey="value"
                                                >
                                                    {stats.collegeData.map((entry, index) => (
                                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                                    ))}
                                                </Pie>
                                                <RechartsTooltip />
                                                <Legend />
                                            </PieChart>
                                        </ResponsiveContainer>
                                    </div>
                                </Card>
                            </Tooltip>
                        </Col>
                        <Col xs={24} lg={12}>
                            <Tooltip title="Most popular technical skills among candidates">
                                <Card title="⚡ Top Skills" className="shadow-sm">
                                    <div style={{ width: '100%', height: 300 }}>
                                        <ResponsiveContainer>
                                            <BarChart data={stats.skillData.slice(0, 10)} layout="vertical">
                                                <CartesianGrid strokeDasharray="3 3" />
                                                <XAxis type="number" />
                                                <YAxis dataKey="name" type="category" width={100} />
                                                <RechartsTooltip />
                                                <Bar dataKey="value" fill="#8884d8">
                                                    {stats.skillData.slice(0, 10).map((entry, index) => (
                                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                                    ))}
                                                </Bar>
                                            </BarChart>
                                        </ResponsiveContainer>
                                    </div>
                                </Card>
                            </Tooltip>
                        </Col>
                    </Row>

                    {/* Charts Row 2 - Domain Preferences and Daily Applications */}
                    <Row gutter={[16, 16]}>
                        <Col xs={24} lg={12}>
                            <Tooltip title="Preferred domains/job roles">
                                <Card title="🎯 Domain Preferences" className="shadow-sm">
                                    <div style={{ width: '100%', height: 300 }}>
                                        <ResponsiveContainer>
                                            <PieChart>
                                                <Pie
                                                    data={stats.domainData}
                                                    cx="50%"
                                                    cy="50%"
                                                    labelLine={true}
                                                    label={(entry) => `${entry.name}: ${entry.value}`}
                                                    outerRadius={80}
                                                    fill="#8884d8"
                                                    dataKey="value"
                                                >
                                                    {stats.domainData.map((entry, index) => (
                                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                                    ))}
                                                </Pie>
                                                <RechartsTooltip />
                                                <Legend />
                                            </PieChart>
                                        </ResponsiveContainer>
                                    </div>
                                </Card>
                            </Tooltip>
                        </Col>
                        <Col xs={24} lg={12}>
                            <Tooltip title="Daily application trends">
                                <Card title="📅 Daily Applications" className="shadow-sm">
                                    <div style={{ width: '100%', height: 300 }}>
                                        <ResponsiveContainer>
                                            <LineChart data={stats.dailyData}>
                                                <CartesianGrid strokeDasharray="3 3" />
                                                <XAxis dataKey="date" angle={-45} textAnchor="end" height={60} />
                                                <YAxis />
                                                <RechartsTooltip />
                                                <Legend />
                                                <Line
                                                    type="monotone"
                                                    dataKey="count"
                                                    stroke="#8884d8"
                                                    strokeWidth={2}
                                                    dot={{ r: 4 }}
                                                    activeDot={{ r: 8 }}
                                                />
                                            </LineChart>
                                        </ResponsiveContainer>
                                    </div>
                                </Card>
                            </Tooltip>
                        </Col>
                    </Row>

                    {/* Year of Study Distribution */}
                    {stats.yearData.length > 0 && (
                        <Row gutter={[16, 16]}>
                            <Col xs={24}>
                                <Tooltip title="Distribution by year of study">
                                    <Card title="📚 Year of Study Distribution" className="shadow-sm">
                                        <div style={{ width: '100%', height: 300 }}>
                                            <ResponsiveContainer>
                                                <BarChart data={stats.yearData}>
                                                    <CartesianGrid strokeDasharray="3 3" />
                                                    <XAxis dataKey="name" />
                                                    <YAxis />
                                                    <RechartsTooltip />
                                                    <Legend />
                                                    <Bar dataKey="value" fill="#82ca9d">
                                                        {stats.yearData.map((entry, index) => (
                                                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                                        ))}
                                                    </Bar>
                                                </BarChart>
                                            </ResponsiveContainer>
                                        </div>
                                    </Card>
                                </Tooltip>
                            </Col>
                        </Row>
                    )}

                    {/* Recent Candidates */}
                    <Row gutter={[16, 16]}>
                        <Col xs={24}>
                            <Tooltip title="Most recently added candidates">
                                <Card title="🆕 Recent Candidates" className="shadow-sm">
                                    <Table
                                        dataSource={recentStudents}
                                        columns={recentColumns}
                                        pagination={false}
                                        size="small"
                                        className="border rounded"
                                    />
                                </Card>
                            </Tooltip>
                        </Col>
                    </Row>

                    {/* Summary Statistics - Fixed deprecated valueStyle */}
                    <Row gutter={[16, 16]}>
                        <Col xs={24}>
                            <Card title="📊 Quick Stats" className="shadow-sm bg-gray-50">
                                <Row gutter={16}>
                                    <Col span={8}>
                                        <Tooltip title="Total number of skills mentioned">
                                            <Statistic
                                                title="Total Skills Mentioned"
                                                value={stats.totalSkills}
                                                styles={{
                                                    content: {
                                                        fontSize: '20px',
                                                        fontWeight: 'bold'
                                                    }
                                                }}
                                            />
                                        </Tooltip>
                                    </Col>
                                    <Col span={8}>
                                        <Tooltip title="Candidates who listed skills">
                                            <Statistic
                                                title="Candidates with Skills"
                                                value={stats.studentsWithSkills}
                                                suffix={`/ ${stats.total}`}
                                                styles={{
                                                    content: {
                                                        fontSize: '20px',
                                                        fontWeight: 'bold'
                                                    }
                                                }}
                                            />
                                        </Tooltip>
                                    </Col>
                                    <Col span={8}>
                                        <Tooltip title="Most represented college">
                                            <Statistic
                                                title="Top College"
                                                value={stats.collegeData[0]?.name || 'N/A'}
                                                styles={{
                                                    content: {
                                                        fontSize: '20px',
                                                        fontWeight: 'bold',
                                                        color: stats.collegeData[0]?.name ? '#1890ff' : 'inherit'
                                                    }
                                                }}
                                            />
                                        </Tooltip>
                                    </Col>
                                </Row>
                            </Card>
                        </Col>
                    </Row>
                </div>
            )}
        </Modal>
    );
}