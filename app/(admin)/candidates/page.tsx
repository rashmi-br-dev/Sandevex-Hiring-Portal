"use client";

import { useEffect, useState } from "react";
import {
    Table, Input, Typography, Button, message, Tooltip, Tag, Modal, Space
} from "antd";
import type { ColumnsType, TablePaginationConfig } from "antd/es/table";
import {
    SearchOutlined, SyncOutlined, FilterOutlined,
    BarChartOutlined, UserOutlined
} from "@ant-design/icons";
import StudentDetailsModal from "@/components/StudentDetailsModal";
import SummaryModal from "@/components/SummaryModal";

const { Title } = Typography;

interface Student {
    _id: string;
    fullName: string;
    email: string;
    mobile: string;
    collegeName: string;
    preferredDomain: string;
    degree?: string;
    branch?: string;
    yearOfStudy?: string;
    technicalSkills?: string[];
    priorExperience?: string;
    whySandevex?: string;
    cityState?: string;
    portfolioUrl?: string;
    createdAt: string;
}

export default function CandidatesPage() {
    const [students, setStudents] = useState<Student[]>([]);
    const [loading, setLoading] = useState(false);
    const [syncing, setSyncing] = useState(false);
    const [collegeFilters, setCollegeFilters] = useState<{ text: string; value: string }[]>([]);
    const [isModalVisible, setIsModalVisible] = useState(false);
    const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
    const [summaryModalVisible, setSummaryModalVisible] = useState(false);

    const [search, setSearch] = useState("");
    const [debouncedSearch, setDebouncedSearch] = useState("");

    const [pagination, setPagination] = useState<TablePaginationConfig>({
        current: 1,
        pageSize: 10,
        total: 0,
    });

    const [sortOrder, setSortOrder] = useState<"new" | "old">("new");
    const [selectedCollege, setSelectedCollege] = useState<string | null>(null);

    // Mock offer statuses (replace with actual data)
    const [offerStatuses, setOfferStatuses] = useState<Record<string, string>>({});

    // debounce search
    useEffect(() => {
        const t = setTimeout(() => {
            setDebouncedSearch(search);
            setPagination((p) => ({ ...p, current: 1 }));
        }, 500);
        return () => clearTimeout(t);
    }, [search]);

    // fetch unique colleges for filter
    async function fetchCollegeFilters() {
        try {
            const domainRes = await fetch('/api/domain-preferences?limit=1000');
            const domainData = await domainRes.json();

            const res = await fetch("/api/students/colleges");

            if (!res.ok) {
                throw new Error(`HTTP error! status: ${res.status}`);
            }

            const data = await res.json();

            if (data.colleges && Array.isArray(data.colleges)) {
                const filters = data.colleges.map((college: string) => ({
                    text: college,
                    value: college,
                }));
                setCollegeFilters(filters);
            }
        } catch (error) {
            console.error("Failed to fetch colleges:", error);
            message.error("Failed to load college filters");
        }
    }

    // fetch students
    async function fetchStudents(
        page = 1,
        pageSize = 10,
        searchText = "",
        sort = sortOrder,
        college = selectedCollege
    ) {
        try {
            setLoading(true);

            let url = `/api/students?page=${page}&limit=${pageSize}&search=${encodeURIComponent(searchText)}&sort=${sort}`;
            if (college) {
                url += `&college=${encodeURIComponent(college)}`;
            }

            const res = await fetch(url);

            if (!res.ok) {
                throw new Error(`HTTP error! status: ${res.status}`);
            }

            const data = await res.json();

            setStudents(data.students || []);
            setPagination({
                current: page,
                pageSize,
                total: data.total || 0,
            });
        } catch (error) {
            console.error("Failed to load students:", error);
            message.error("Failed to load students");
            setStudents([]);
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        fetchCollegeFilters();
    }, []);

    useEffect(() => {
        fetchStudents(1, pagination.pageSize!, debouncedSearch, sortOrder, selectedCollege);
    }, [debouncedSearch, sortOrder, selectedCollege]);

    // sync students
    async function handleSync() {
        try {
            setSyncing(true);
            const res = await fetch("/api/students/sync", { method: "POST" });

            if (!res.ok) {
                throw new Error(`HTTP error! status: ${res.status}`);
            }

            const data = await res.json();

            if (data.success) {
                message.success(`Synced ${data.inserted || 0} students`);
                await fetchCollegeFilters(); // Refresh college filters after sync
                fetchStudents(1, pagination.pageSize!, debouncedSearch, sortOrder, selectedCollege);
            } else {
                message.error(data.error || "Sync failed");
            }
        } catch (error) {
            console.error("Sync failed:", error);
            message.error("Sync failed");
        } finally {
            setSyncing(false);
        }
    }

    // Handle filter change - this will be called immediately when checkboxes are selected
    const handleFilterChange = (filters: any) => {
        const collegeValue = filters.collegeName?.[0] || null;
        setSelectedCollege(collegeValue);

        // Reset to first page when filter changes
        setPagination(prev => ({ ...prev, current: 1 }));

        // Fetch with new filter
        fetchStudents(1, pagination.pageSize!, debouncedSearch, sortOrder, collegeValue);
    };

    // table change (for pagination and sorting only)
    const handleTableChange = (
        newPagination: TablePaginationConfig,
        filters: any,
        sorter: any
    ) => {
        const order = sorter.order === "ascend" ? "old" : "new";
        setSortOrder(order);

        fetchStudents(
            newPagination.current!,
            newPagination.pageSize!,
            debouncedSearch,
            order,
            selectedCollege // Use current selectedCollege instead of filters
        );
    };

    const handleClearFilters = () => {
        setSelectedCollege(null);
        setPagination(prev => ({ ...prev, current: 1 }));
        fetchStudents(1, pagination.pageSize!, debouncedSearch, sortOrder, null);
    };

    // Row click handler
    const handleRowClick = (record: Student) => {
        setSelectedStudent(record);
        setIsModalVisible(true);
    };

    // Modal handlers
    const handleCloseModal = () => {
        setIsModalVisible(false);
        setSelectedStudent(null);
    };

    // Summary modal
    const showSummary = () => {
        setSummaryModalVisible(true);
    };

    // Handle set as intern
    const handleSetAsIntern = async (student: Student) => {
        try {
            console.log("🔍 Setting as intern - Student data:", {
                _id: student._id,
                fullName: student.fullName,
                email: student.email,
                mobile: student.mobile,
            });

            // Find offer for this student
            const offersRes = await fetch('/api/offers');
            const offersData = await offersRes.json();
            console.log("📋 Offers API response:", {
                success: offersData.success,
                totalOffers: offersData.offers?.length,
                sampleOffer: offersData.offers?.[0]
            });
            
            const studentOffer = offersData.offers?.find((offer: any) => 
                offer.email === student.email
            );

            console.log("🎯 Offer match result:", {
                studentEmail: student.email,
                offerFound: !!studentOffer,
                offerDetails: studentOffer ? {
                    _id: studentOffer._id,
                    email: studentOffer.email,
                    status: studentOffer.status,
                    candidateEmail: studentOffer.candidate?.email
                } : null
            });

            if (!studentOffer) {
                message.error('No offer found for this student');
                return;
            }

            // Find domain preference for this student
            const domainRes = await fetch('/api/domain-preferences?limit=1000');
            const domainData = await domainRes.json();
            console.log("📚 Domain preferences API response:", {
                success: domainData.success,
                totalPreferences: domainData.data?.length,
                samplePreference: domainData.data?.[0]
            });
            
            // Log all emails in domain preferences for debugging
            const domainEmails = domainData.data?.map((pref: any) => pref.email) || [];
            console.log("📧 All emails in domain preferences:", domainEmails);
            console.log("🔍 Looking for student email:", student.email);

            const studentDomain = domainData.data?.find((pref: any) => 
                pref.email === student.email
            );

            console.log("🎯 Domain preference match result:", {
                studentEmail: student.email,
                preferenceFound: !!studentDomain,
                preferenceDetails: studentDomain ? {
                    _id: studentDomain._id,
                    email: studentDomain.email,
                    domain: studentDomain.domain,
                    skillLevel: studentDomain.skillLevel
                } : null
            });

            if (!studentDomain) {
                message.error('No domain preference found for this student');
                return;
            }

            // Create intern
            console.log("🚀 Creating intern with data:", {
                studentId: student._id,
                offerId: studentOffer._id,
                domainPreferenceId: studentDomain._id
            });

            const internRes = await fetch('/api/interns', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    studentId: student._id,
                    offerId: studentOffer._id,
                    domainPreferenceId: studentDomain._id
                })
            });

            const internData = await internRes.json();
            console.log("✅ Intern creation result:", {
                success: internData.success,
                error: internData.error,
                internId: internData.intern?._id
            });

            if (internData.success) {
                message.success('Student successfully converted to intern!');
                // Refresh the students list
                fetchStudents(1, pagination.pageSize!, debouncedSearch, sortOrder, selectedCollege);
            } else {
                message.error(internData.error || 'Failed to convert student to intern');
            }
        } catch (error: any) {
            console.error('❌ Error setting as intern:', error);
            message.error('Failed to convert student to intern');
        }
    };

    const columns: ColumnsType<Student> = [
        {
            title: "Name",
            dataIndex: "fullName",
            key: "name",
            sorter: true,
            width: 200,
            render: (_, record) => (
                <div>
                    <div className="font-medium">{record.fullName}</div>
                    <div className="text-gray-500 text-xs">{record.email}</div>
                </div>
            ),
        },
        {
            title: "Phone",
            dataIndex: "mobile",
            key: "mobile",
            width: 120,
            render: (mobile: string) => mobile || "-",
        },
        {
            title: "College",
            dataIndex: "collegeName",
            key: "college",
            width: 250,

            filterDropdown: ({ close }) => (
                <div className="p-2 max-h-60 overflow-y-auto">
                    {collegeFilters.map((college) => (
                        <label
                            key={college.value}
                            className="flex items-center gap-2 px-2 py-1 hover:bg-gray-100 dark:hover:bg-gray-800 rounded cursor-pointer"
                        >
                            <input
                                type="checkbox"
                                checked={selectedCollege === college.value}
                                onChange={(e) => {
                                    const value = e.target.checked ? college.value : null;

                                    setSelectedCollege(value);
                                    setPagination((p) => ({ ...p, current: 1 }));

                                    fetchStudents(1, pagination.pageSize!, debouncedSearch, sortOrder, value);

                                    close(); // instantly close menu
                                }}
                            />
                            {college.text}
                        </label>
                    ))}
                </div>
            ),

            filterIcon: () => (
                <FilterOutlined style={{ color: selectedCollege ? "#1677ff" : undefined }} />
            ),

            render: (college: string) => college || "-",
        },
        {
            title: "Skills",
            dataIndex: "technicalSkills",
            key: "skills",
            width: 200,
            render: (skills: string[]) => (
                <div className="flex flex-wrap gap-1">
                    {skills?.slice(0, 3).map((skill, index) => (
                        <Tag key={index} color="blue" className="text-xs">
                            {skill}
                        </Tag>
                    ))}
                    {skills?.length > 3 && <Tag className="text-xs">+{skills.length - 3}</Tag>}
                    {(!skills || skills.length === 0) && '-'}
                </div>
            ),
        },
        {
            title: "Applied",
            dataIndex: "createdAt",
            key: "createdAt",
            sorter: true,
            width: 100,
            render: (date: string) => date ? new Date(date).toLocaleDateString() : "-",
        },
        {
            title: "Actions",
            key: "actions",
            width: 120,
            render: (_, record) => (
                <Space>
                    <Tooltip title="Set as Intern">
                        <Button
                            icon={<UserOutlined />}
                            onClick={(e) => {
                                e.stopPropagation();
                                handleSetAsIntern(record);
                            }}
                            size="small"
                            type="primary"
                        >
                            Set as Intern
                        </Button>
                    </Tooltip>
                </Space>
            ),
        },
    ];

    return (
        <div className="p-6 space-y-4">

            {/* Header */}
            <div className="flex justify-between items-center">
                <div className="flex items-center gap-3">
                    <Title level={3} className="!mb-0">
                        Candidates
                    </Title>
                    <Tooltip title="View Summary Dashboard">
                        <Button
                            icon={<BarChartOutlined />}
                            onClick={showSummary}
                            shape="circle"
                        />
                    </Tooltip>
                </div>

                <div className="flex gap-3">
                    <Input
                        placeholder="Search by name, email, phone, or college..."
                        prefix={<SearchOutlined />}
                        allowClear
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        style={{ width: 320 }}
                    />

                    <Button
                        icon={<SyncOutlined spin={syncing} />}
                        onClick={handleSync}
                        loading={syncing}
                    >
                        Sync
                    </Button>
                </div>
            </div>

            {/* Active Filters */}
            <div className="min-h-[30px]">
                {selectedCollege ? (
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <span className="text-sm text-muted-foreground">Active filter:</span>
                            <span className="inline-flex items-center gap-1 px-3 py-1 bg-secondary text-secondary-foreground rounded-full text-sm border border-border">
                                College: {selectedCollege}
                                <button
                                    onClick={handleClearFilters}
                                    className="ml-1 text-muted-foreground hover:text-foreground transition-colors"
                                >
                                    ×
                                </button>
                            </span>
                        </div>
                        <Button
                            size="small"
                            icon={<FilterOutlined />}
                            onClick={handleClearFilters}
                        >
                            Clear all filters
                        </Button>
                    </div>
                ) : null}
            </div>

            {/* Table */}
            <div className="border rounded-lg overflow-hidden">
                <Table
                    rowKey="_id"
                    columns={columns}
                    dataSource={students}
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
                            `${range[0]}-${range[1]} of ${total} students`,
                    }}
                    scroll={{ y: "calc(100vh - 350px)" }}
                    locale={{
                        emptyText: loading ? 'Loading...' : 'No candidates found'
                    }}
                />
            </div>

            {/* Modals */}
            <StudentDetailsModal
                visible={isModalVisible}
                student={selectedStudent}
                onClose={handleCloseModal}
                offerStatuses={offerStatuses}
            />

            <SummaryModal
                visible={summaryModalVisible}
                onClose={() => setSummaryModalVisible(false)}
            />
        </div>
    );
}