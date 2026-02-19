"use client";

import { useEffect, useState } from "react";
import { Modal, Spin, Row, Col, Card, Statistic, message } from "antd";
import {
    PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis,
    CartesianGrid, Tooltip as RechartsTooltip, Legend,
    ResponsiveContainer, LineChart, Line
} from 'recharts';

interface OfferSummaryModalProps {
    visible: boolean;
    onClose: () => void;
}

interface StatsData {
    total: number;
    notSent: number;
    pending: number;
    accepted: number;
    declined: number;
    expired: number;
    dailyTrend: Array<{ date: string; count: number }>;
    collegeDistribution: Array<{ name: string; value: number }>;
}

const COLORS = ['#8c8c8c', '#1890ff', '#52c41a', '#f5222d', '#faad14', '#722ed1'];

export default function OfferSummaryModal({ visible, onClose }: OfferSummaryModalProps) {
    const [loading, setLoading] = useState(false);
    const [stats, setStats] = useState<StatsData>({
        total: 0,
        notSent: 0,
        pending: 0,
        accepted: 0,
        declined: 0,
        expired: 0,
        dailyTrend: [],
        collegeDistribution: []
    });

    const fetchStats = async () => {
        try {
            setLoading(true);
            const res = await fetch('/api/offers/summary-stats');
            const data = await res.json();

            if (!res.ok) throw new Error(data.error);

            setStats({
                total: data.total || 0,
                notSent: data.notSent || 0,
                pending: data.pending || 0,
                accepted: data.accepted || 0,
                declined: data.declined || 0,
                expired: data.expired || 0,
                dailyTrend: data.dailyTrend || [],
                collegeDistribution: data.collegeDistribution || []
            });
        } catch (error: any) {
            message.error(error.message || "Failed to fetch statistics");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (visible) {
            fetchStats();
        }
    }, [visible]);

    const pieData = [
        { name: 'Not Sent', value: stats.notSent },
        { name: 'Pending', value: stats.pending },
        { name: 'Accepted', value: stats.accepted },
        { name: 'Declined', value: stats.declined },
        { name: 'Expired', value: stats.expired },
    ].filter(item => item.value > 0);

    // Calculate response rate based on total candidates (excluding not sent)
    const respondedCount = stats.accepted + stats.declined;
    const totalWithOffers = stats.total - stats.notSent;
    const responseRate = totalWithOffers > 0 ? Math.round((respondedCount / totalWithOffers) * 100) : 0;

    return (
        <Modal
            title="Offer Summary Dashboard"
            open={visible}
            onCancel={onClose}
            footer={null}
            width={1200}
            centered
            styles={{
                body: {
                    maxHeight: '80vh',
                    overflowY: 'auto',
                    padding: '24px'
                }
            }}
        >
            {loading ? (
                <div className="h-96 flex items-center justify-center">
                    <Spin size="large" />
                </div>
            ) : (
                <div className="space-y-6">
                    {/* Quick Stats Cards - Updated to include Not Sent */}
                    <Row gutter={16}>
                        <Col span={4}>
                            <Card size="small" className="text-center">
                                <Statistic
                                    title="Total Candidates"
                                    value={stats.total}
                                    styles={{
                                        content: {
                                            color: '#1890ff',
                                            fontSize: '24px',
                                            fontWeight: 'bold'
                                        }
                                    }}
                                />
                            </Card>
                        </Col>
                        <Col span={3}>
                            <Card size="small" className="text-center">
                                <Statistic
                                    title="Not Sent"
                                    value={stats.notSent}
                                    styles={{
                                        content: {
                                            color: '#8c8c8c',
                                            fontSize: '24px',
                                            fontWeight: 'bold'
                                        }
                                    }}
                                />
                            </Card>
                        </Col>
                        <Col span={3}>
                            <Card size="small" className="text-center">
                                <Statistic
                                    title="Pending"
                                    value={stats.pending}
                                    styles={{
                                        content: {
                                            color: '#1890ff',
                                            fontSize: '24px',
                                            fontWeight: 'bold'
                                        }
                                    }}
                                />
                            </Card>
                        </Col>
                        <Col span={3}>
                            <Card size="small" className="text-center">
                                <Statistic
                                    title="Accepted"
                                    value={stats.accepted}
                                    styles={{
                                        content: {
                                            color: '#52c41a',
                                            fontSize: '24px',
                                            fontWeight: 'bold'
                                        }
                                    }}
                                />
                            </Card>
                        </Col>
                        <Col span={3}>
                            <Card size="small" className="text-center">
                                <Statistic
                                    title="Expired"
                                    value={stats.expired}
                                    styles={{
                                        content: {
                                            color: '#f5a422ff',
                                            fontSize: '24px',
                                            fontWeight: 'bold'
                                        }
                                    }}
                                />
                            </Card>
                        </Col>
                        <Col span={3}>
                            <Card size="small" className="text-center">
                                <Statistic
                                    title="Declined"
                                    value={stats.declined}
                                    styles={{
                                        content: {
                                            color: '#f5222d',
                                            fontSize: '24px',
                                            fontWeight: 'bold'
                                        }
                                    }}
                                />
                            </Card>
                        </Col>
                        <Col span={4}>
                            <Card size="small" className="text-center">
                                <Statistic
                                    title="Response Rate"
                                    value={responseRate}
                                    suffix="%"
                                    styles={{
                                        content: {
                                            color: '#722ed1',
                                            fontSize: '24px',
                                            fontWeight: 'bold'
                                        }
                                    }}
                                />
                            </Card>
                        </Col>
                    </Row>

                    {/* First Row - Daily Trend and Status Distribution */}
                    <Row gutter={16}>
                        {/* Daily Trend Line Chart */}
                        <Col span={12}>
                            <Card title="Daily Offer Trend" size="small">
                                <div className="h-64">
                                    {stats.dailyTrend && stats.dailyTrend.length > 0 ? (
                                        <ResponsiveContainer width="100%" height="100%">
                                            <LineChart
                                                data={stats.dailyTrend}
                                                margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                                            >
                                                <CartesianGrid strokeDasharray="3 3" />
                                                <XAxis dataKey="date" />
                                                <YAxis />
                                                <RechartsTooltip />
                                                <Legend />
                                                <Line type="monotone" dataKey="count" stroke="#1890ff" name="Offers Sent" />
                                            </LineChart>
                                        </ResponsiveContainer>
                                    ) : (
                                        <div className="h-full flex items-center justify-center text-gray-400">
                                            No trend data available
                                        </div>
                                    )}
                                </div>
                            </Card>
                        </Col>

                        {/* Status Distribution Pie Chart - Updated with Not Sent */}
                        <Col span={12}>
                            <Card title="Status Distribution" size="small">
                                <div className="h-64">
                                    {pieData.length > 0 ? (
                                        <ResponsiveContainer width="100%" height="100%">
                                            <PieChart>
                                                <Pie
                                                    data={pieData}
                                                    cx="50%"
                                                    cy="50%"
                                                    labelLine={true}
                                                    label={(entry) => `${entry.name}: ${entry.value}`}
                                                    outerRadius={80}
                                                    fill="#8884d8"
                                                    dataKey="value"
                                                >
                                                    {pieData.map((entry, index) => (
                                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                                    ))}
                                                </Pie>
                                                <RechartsTooltip />
                                                <Legend />
                                            </PieChart>
                                        </ResponsiveContainer>
                                    ) : (
                                        <div className="h-full flex items-center justify-center text-gray-400">
                                            No data available
                                        </div>
                                    )}
                                </div>
                            </Card>
                        </Col>
                    </Row>

                    {/* Second Row - Top Colleges (Full Width at Bottom) */}
                    <Row>
                        <Col span={24}>
                            <Card title="Top Colleges by Offer Acceptance" size="small">
                                <div className="h-80">
                                    {stats.collegeDistribution && stats.collegeDistribution.length > 0 ? (
                                        <ResponsiveContainer width="100%" height="100%">
                                            <BarChart
                                                data={stats.collegeDistribution.slice(0, 8)}
                                                layout="vertical"
                                                margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                                            >
                                                <CartesianGrid strokeDasharray="3 3" />
                                                <XAxis type="number" />
                                                <YAxis type="category" dataKey="name" width={150} />
                                                <RechartsTooltip />
                                                <Bar dataKey="value" fill="#1890ff" name="Accepted Offers" />
                                            </BarChart>
                                        </ResponsiveContainer>
                                    ) : (
                                        <div className="h-full flex items-center justify-center text-gray-400">
                                            No college data available
                                        </div>
                                    )}
                                </div>
                            </Card>
                        </Col>
                    </Row>

                    {/* Summary Footer */}
                    <div className="text-right text-gray-400 text-sm">
                        Last updated: {new Date().toLocaleString()}
                    </div>
                </div>
            )}
        </Modal>
    );
}