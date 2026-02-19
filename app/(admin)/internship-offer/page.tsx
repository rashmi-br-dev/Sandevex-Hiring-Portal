"use client";

import { useEffect, useState, useMemo } from "react";
import {
    Table, Tag, Button, Space, Typography, Input, message,
    Tooltip, Dropdown
} from "antd";
import type { ColumnsType, TablePaginationConfig } from "antd/es/table";
import type { MenuProps } from "antd";
import {
    ReloadOutlined, SearchOutlined, FilterOutlined,
    BarChartOutlined, SendOutlined, CheckCircleOutlined,
    CloseCircleOutlined, ClockCircleOutlined
} from "@ant-design/icons";
import OfferSummaryModal from "@/components/OfferSummaryModal";
import StudentDetailsModal from "@/components/StudentDetailsModal";
import { sendOfferEmail } from "@/lib/sendOfferEmail";

const { Title } = Typography;

interface Candidate {
    _id: string;
    fullName: string;
    email: string;
    mobile: string;
    collegeName: string;
    degree?: string;
    branch?: string;
    yearOfStudy?: string;
    technicalSkills?: string[];
    cityState?: string;
    createdAt: string;
    offerStatus?: 'pending' | 'accepted' | 'declined' | 'expired' | 'not_sent';
    offerId?: string;
    offerSentAt?: string;
    offerExpiresAt?: string;
}

export default function OffersPage() {
    const [allCandidates, setAllCandidates] = useState<Candidate[]>([]);
    const [loading, setLoading] = useState(false);
    const [search, setSearch] = useState("");
    const [statusFilter, setStatusFilter] = useState<string | undefined>(undefined);
    const [summaryModalVisible, setSummaryModalVisible] = useState(false);
    const [studentModalVisible, setStudentModalVisible] = useState(false);
    const [selectedStudent, setSelectedStudent] = useState<any>(null);

    const [pagination, setPagination] = useState<TablePaginationConfig>({
        current: 1,
        pageSize: 10,
        total: 0,
    });

    // Fetch ALL candidates once
    const fetchAllCandidates = async () => {
        try {
            setLoading(true);
            const res = await fetch(`/api/candidates/with-offer-status?all=true`);
            const data = await res.json();

            if (!res.ok) throw new Error(data.error);

            setAllCandidates(data.candidates || []);
            setPagination(prev => ({
                ...prev,
                total: data.candidates?.length || 0,
            }));
        } catch (error: any) {
            message.error(error.message || "Failed to load candidates");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchAllCandidates();
    }, []);

    // Apply filters to ALL candidates (not just paginated)
    const filteredCandidates = useMemo(() => {
        let filtered = [...allCandidates];

        // Apply search filter
        if (search) {
            const searchLower = search.toLowerCase();
            filtered = filtered.filter(candidate =>
                candidate.fullName?.toLowerCase().includes(searchLower) ||
                candidate.email?.toLowerCase().includes(searchLower) ||
                candidate.collegeName?.toLowerCase().includes(searchLower) ||
                candidate.mobile?.includes(search)
            );
        }

        // Apply status filter
        if (statusFilter && statusFilter !== 'all') {
            filtered = filtered.filter(candidate =>
                candidate.offerStatus === statusFilter
            );
        }

        return filtered;
    }, [allCandidates, search, statusFilter]);

    // Get paginated data from filtered results
    const paginatedCandidates = useMemo(() => {
        const start = (pagination.current! - 1) * pagination.pageSize!;
        const end = start + pagination.pageSize!;
        return filteredCandidates.slice(start, end);
    }, [filteredCandidates, pagination.current, pagination.pageSize]);

    // Update total when filters change
    useEffect(() => {
        setPagination(prev => ({
            ...prev,
            current: 1, // Reset to first page when filters change
            total: filteredCandidates.length,
        }));
    }, [filteredCandidates.length]);

    const sendOffer = async (candidate: Candidate) => {
        try {
            // console.log("📤 Sending offer for candidate:", candidate._id, candidate.email);

            // STEP 1: Create offer in database
            const res = await fetch("/api/offers", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    candidateId: candidate._id,
                    email: candidate.email
                }),
            });

            // console.log("📥 Response status:", res.status);

            const data = await res.json();
            // console.log("📦 Response data:", data);

            if (!res.ok) throw new Error(data.error);

            // 🟢 Offer created successfully
            message.success("Offer created successfully");

            // STEP 2: Send email with the token from the response
            try {
                const token = data.offer?.token || data.token;

                await sendOfferEmail({
                    email: candidate.email,
                    full_name: candidate.fullName,
                    position: "Software Engineer Intern",
                    department: "Engineering",
                    mode: "Remote",
                    duration: "6 Months",
                    token: token
                });

                console.log("✅ Email sent successfully");
                message.success("Offer email sent 📩");

            } catch (emailError) {
                console.error("❌ Email failed:", emailError);
                message.warning("Offer created but email failed to send");
            }

            // STEP 3: Refresh the list
            fetchAllCandidates();

        } catch (e: any) {
            console.error("❌ Send offer error:", e);
            message.error(e.message || "Failed to create offer");
        }
    };

    const resendOffer = async (candidate: Candidate) => {
        try {
            const res = await fetch("/api/offers/resend", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ offerId: candidate.offerId }),
            });

            const data = await res.json();
            if (!res.ok) throw new Error(data.error);

            message.success("Offer reset successfully");

            try {
                const token = data.offer?.token || data.token;
                console.log("✅ Token received:", token);

                await sendOfferEmail({
                    email: candidate.email,
                    full_name: candidate.fullName,
                    position: "Software Engineer Intern",
                    department: "Engineering",
                    mode: "Remote",
                    duration: "6 Months",
                    token: token
                });

                message.success("New offer email sent 🔁");

            } catch {
                message.warning("Offer updated but email failed to send");
            }

            fetchAllCandidates();

        } catch (e: any) {
            message.error(e.message || "Failed to resend offer");
        }
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'accepted': return 'success';
            case 'pending': return 'processing';
            case 'declined': return 'error';
            case 'expired': return 'default';
            case 'not_sent': return 'default';
            default: return 'default';
        }
    };

    const getStatusIcon = (status: string) => {
        switch (status) {
            case 'accepted': return <CheckCircleOutlined />;
            case 'pending': return <ClockCircleOutlined />;
            case 'declined': return <CloseCircleOutlined />;
            case 'expired': return <CloseCircleOutlined />;
            case 'not_sent': return <SendOutlined />;
            default: return null;
        }
    };

    const getStatusText = (status: string) => {
        switch (status) {
            case 'accepted': return 'Accepted';
            case 'pending': return 'Pending';
            case 'declined': return 'Declined';
            case 'expired': return 'Expired';
            case 'not_sent': return 'Not Sent';
            default: return 'Unknown';
        }
    };

    // Row click handler
    const handleRowClick = (record: Candidate) => {
        setSelectedStudent(record);
        setStudentModalVisible(true);
    };

    // Filter menu items for Status column
    const statusFilterItems: MenuProps['items'] = [
        {
            key: 'all',
            label: 'All',
            onClick: () => setStatusFilter(undefined)
        },
        {
            type: 'divider'
        },
        {
            key: 'not_sent',
            label: <span><SendOutlined className="mr-2 text-gray-500" /> Not Sent</span>,
            onClick: () => setStatusFilter('not_sent')
        },
        {
            key: 'pending',
            label: <span><ClockCircleOutlined className="mr-2 text-blue-500" /> Pending</span>,
            onClick: () => setStatusFilter('pending')
        },
        {
            key: 'accepted',
            label: <span><CheckCircleOutlined className="mr-2 text-green-500" /> Accepted</span>,
            onClick: () => setStatusFilter('accepted')
        },
        {
            key: 'declined',
            label: <span><CloseCircleOutlined className="mr-2 text-red-500" /> Declined</span>,
            onClick: () => setStatusFilter('declined')
        },
        {
            key: 'expired',
            label: <span><CloseCircleOutlined className="mr-2 text-gray-500" /> Expired</span>,
            onClick: () => setStatusFilter('expired')
        },
    ];

    const columns: ColumnsType<Candidate> = [
        {
            title: "Candidate",
            key: "candidate",
            width: 250,
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
            width: 200,
            render: (_, r) => r.collegeName || '-',
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
                    icon={getStatusIcon(r.offerStatus || 'not_sent')}
                    color={getStatusColor(r.offerStatus || 'not_sent')}
                    className="px-3 py-1"
                >
                    {getStatusText(r.offerStatus || 'not_sent')}
                </Tag>
            ),
        },
        {
            title: "Sent",
            key: "sentAt",
            width: 150,
            render: (_, r) => r.offerSentAt ? new Date(r.offerSentAt).toLocaleString() : '-',
        },
        {
            title: "Expires",
            key: "expiresAt",
            width: 150,
            render: (_, r) => {
                if (!r.offerExpiresAt) return '-';
                const date = new Date(r.offerExpiresAt);
                const isExpired = date < new Date();
                return (
                    <span className={isExpired ? 'text-red-500' : 'text-green-500'}>
                        {date.toLocaleString()}
                    </span>
                );
            },
        },
        {
            title: "Actions",
            key: "actions",
            width: 100,
            render: (_, r) => (
                <Space>
                    {r.offerStatus === 'not_sent' ? (
                        <Tooltip title="Send Offer">
                            <Button
                                icon={<SendOutlined style={{ color: '#52c41a' }} />}
                                onClick={(e) => {
                                    e.stopPropagation();
                                    sendOffer(r);
                                }}
                                size="small"
                                shape="circle"
                                style={{
                                    borderColor: '#52c41a',
                                    backgroundColor: 'transparent'
                                }}
                                className="hover:bg-green-50"
                            />
                        </Tooltip>
                    ) : (
                        <Tooltip
                            title={
                                r.offerStatus === "accepted"
                                    ? "Offer already accepted - cannot resend"
                                    : r.offerStatus === "expired"
                                        ? "Offer expired"
                                        : "Resend Offer"
                            }
                        >
                            <Button
                                icon={<SendOutlined style={{ color: r.offerStatus === "accepted" ? '#d9d9d9' : '#1890ff' }} />}
                                onClick={(e) => {
                                    e.stopPropagation();
                                    resendOffer(r);
                                }}
                                disabled={r.offerStatus === "accepted" || r.offerStatus === "expired"}
                                size="small"
                                shape="circle"
                                style={{
                                    borderColor: r.offerStatus === "accepted" ? '#d9d9d9' : '#1890ff',
                                    backgroundColor: 'transparent'
                                }}
                                className={r.offerStatus === "accepted" ? '' : 'hover:bg-blue-50'}
                            />
                        </Tooltip>
                    )}
                </Space>
            ),
        },
    ];

    const handleTableChange = (newPagination: TablePaginationConfig) => {
        setPagination({
            ...newPagination,
            total: filteredCandidates.length,
        });
    };

    const clearFilters = () => {
        setSearch("");
        setStatusFilter(undefined);
    };

    return (
        <div className="p-6 space-y-4">
            {/* Header */}
            <div className="flex justify-between items-center">
                <div className="flex items-center gap-3">
                    <Title level={3} className="!mb-0">
                        Candidates & Offers
                    </Title>
                    <Tooltip title="Refresh">
                        <Button
                            icon={<ReloadOutlined />}
                            onClick={fetchAllCandidates}
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
                    <Input
                        placeholder="Search candidates..."
                        prefix={<SearchOutlined className="text-gray-400" />}
                        allowClear
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        style={{ width: 250 }}
                    />

                    {(search || statusFilter) && (
                        <Button icon={<FilterOutlined />} onClick={clearFilters}>
                            Clear
                        </Button>
                    )}
                </div>
            </div>

            {/* Table */}
            <Table
                rowKey="_id"
                columns={columns}
                dataSource={paginatedCandidates}
                loading={loading}
                onChange={handleTableChange}
                onRow={(record) => ({
                    onClick: () => handleRowClick(record),
                    className: 'cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-900'
                })}
                pagination={{
                    ...pagination,
                    showSizeChanger: true,
                    pageSizeOptions: ["10", "20", "50", "100"],
                    showTotal: (total, range) =>
                        `${range[0]}-${range[1]} of ${total} candidates`,
                }}
                scroll={{ y: "calc(100vh - 300px)" }}
                locale={{
                    emptyText: loading ? 'Loading...' : 'No candidates found'
                }}
            />

            {/* Summary Modal */}
            <OfferSummaryModal
                visible={summaryModalVisible}
                onClose={() => setSummaryModalVisible(false)}
            />

            {/* Student Details Modal */}
            <StudentDetailsModal
                visible={studentModalVisible}
                student={selectedStudent}
                onClose={() => setStudentModalVisible(false)}
                offerStatuses={{}}
                onSendOffer={async (studentId: string, email: string) => {
                    const candidate: Candidate = {
                        _id: studentId,
                        email,
                        fullName: selectedStudent?.fullName || '',
                        mobile: selectedStudent?.mobile || '',
                        collegeName: selectedStudent?.collegeName || '',
                        degree: selectedStudent?.degree,
                        branch: selectedStudent?.branch,
                        yearOfStudy: selectedStudent?.yearOfStudy,
                        technicalSkills: selectedStudent?.technicalSkills,
                        cityState: selectedStudent?.cityState,
                        createdAt: selectedStudent?.createdAt || '',
                        offerStatus: selectedStudent?.offerStatus,
                        offerId: selectedStudent?.offerId
                    };
                    await sendOffer(candidate);
                }}
            />
        </div>
    );
}