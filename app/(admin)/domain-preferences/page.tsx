"use client";

import { useEffect, useState } from "react";
import {
    Table, Input, Typography, Button, message, Tooltip, Tag, Modal
} from "antd";
import type { ColumnsType, TablePaginationConfig } from "antd/es/table";
import {
    SearchOutlined, SyncOutlined, FilterOutlined,
    BarChartOutlined
} from "@ant-design/icons";
import DomainPreferenceSummaryModal from "@/components/DomainPreferenceSummaryModal";

const { Title } = Typography;

interface DomainPreference {
    _id: string;
    timestamp: string;
    fullName: string;
    email: string;
    contactNumber: string;
    collegeName: string;
    yearOfStudy: string;
    domain: string;
    skillLevel: string;
    interestReason: string;
    technologies: string[];
    emailAddress: string;
}

export default function DomainPreferencesPage() {
    const [preferences, setPreferences] = useState<DomainPreference[]>([]);
    const [loading, setLoading] = useState(false);
    const [syncing, setSyncing] = useState(false);
    const [domainFilters, setDomainFilters] = useState<{ text: string; value: string }[]>([]);
    const [collegeFilters, setCollegeFilters] = useState<{ text: string; value: string }[]>([]);
    const [skillLevelFilters, setSkillLevelFilters] = useState<{ text: string; value: string }[]>([]);
    const [isModalVisible, setIsModalVisible] = useState(false);
    const [selectedPreference, setSelectedPreference] = useState<DomainPreference | null>(null);
    const [summaryModalVisible, setSummaryModalVisible] = useState(false);

    const [search, setSearch] = useState("");
    const [debouncedSearch, setDebouncedSearch] = useState("");

    const [pagination, setPagination] = useState<TablePaginationConfig>({
        current: 1,
        pageSize: 10,
        total: 0,
    });

    const [selectedDomain, setSelectedDomain] = useState<string | undefined>(undefined);
    const [selectedCollege, setSelectedCollege] = useState<string | undefined>(undefined);
    const [selectedSkillLevel, setSelectedSkillLevel] = useState<string | undefined>(undefined);

    // debounce search
    useEffect(() => {
        const t = setTimeout(() => {
            setDebouncedSearch(search);
            setPagination((p) => ({ ...p, current: 1 }));
        }, 500);
        return () => clearTimeout(t);
    }, [search]);

    // fetch unique filters
    async function fetchFilters() {
        try {
            const res = await fetch("/api/domain-preferences/filters");

            if (!res.ok) {
                throw new Error(`HTTP error! status: ${res.status}`);
            }

            const data = await res.json();

            if (data.success) {
                const domainFilterList = data.domains.map((domain: string) => ({
                    text: domain,
                    value: domain,
                }));
                setDomainFilters(domainFilterList);

                const collegeFilterList = data.colleges.map((college: string) => ({
                    text: college,
                    value: college,
                }));
                setCollegeFilters(collegeFilterList);

                const skillLevelFilterList = data.skillLevels.map((level: string) => ({
                    text: level,
                    value: level,
                }));
                setSkillLevelFilters(skillLevelFilterList);
            }
        } catch (error) {
            console.error("Failed to fetch filters:", error);
            message.error("Failed to load filters");
        }
    }

    // fetch preferences
    async function fetchPreferences(
        page = 1,
        pageSize = 10,
        searchText = "",
        domain = selectedDomain,
        college = selectedCollege,
        skillLevel = selectedSkillLevel
    ) {
        try {
            setLoading(true);

            let url = `/api/domain-preferences?page=${page}&limit=${pageSize}&search=${encodeURIComponent(searchText)}`;
            if (domain) {
                url += `&domain=${encodeURIComponent(domain)}`;
            }
            if (college) {
                url += `&college=${encodeURIComponent(college)}`;
            }
            if (skillLevel) {
                url += `&skillLevel=${encodeURIComponent(skillLevel)}`;
            }

            const res = await fetch(url);

            if (!res.ok) {
                throw new Error(`HTTP error! status: ${res.status}`);
            }

            const data = await res.json();

            setPreferences(data.data || []);
            setPagination({
                current: page,
                pageSize,
                total: data.pagination?.total || 0,
            });
        } catch (error) {
            console.error("Failed to load domain preferences:", error);
            message.error("Failed to load domain preferences");
            setPreferences([]);
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        fetchFilters();
    }, []);

    useEffect(() => {
        fetchPreferences(1, pagination.pageSize!, debouncedSearch, selectedDomain, selectedCollege, selectedSkillLevel);
    }, [debouncedSearch, selectedDomain, selectedCollege, selectedSkillLevel]);

    // sync preferences
    async function handleSync() {
        try {
            setSyncing(true);
            const res = await fetch("/api/sync-domain-preferences", { method: "POST" });

            if (!res.ok) {
                throw new Error(`HTTP error! status: ${res.status}`);
            }

            const data = await res.json();

            if (data.success) {
                message.success(`Sync completed! Imported ${data.imported} new entries.`);
                await fetchFilters(); // Refresh filters after sync
                fetchPreferences(1, pagination.pageSize!, debouncedSearch, selectedDomain, selectedCollege, selectedSkillLevel);
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

    // Summary modal
    const showSummary = () => {
        setSummaryModalVisible(true);
    };

    // Handle filter change
    const handleFilterChange = (filters: any) => {
        const domainValue = filters.domain?.[0] || undefined;
        const collegeValue = filters.collegeName?.[0] || undefined;
        const skillLevelValue = filters.skillLevel?.[0] || undefined;

        setSelectedDomain(domainValue);
        setSelectedCollege(collegeValue);
        setSelectedSkillLevel(skillLevelValue);

        // Reset to first page when filter changes
        setPagination(prev => ({ ...prev, current: 1 }));

        // Fetch with new filters
        fetchPreferences(1, pagination.pageSize!, debouncedSearch, domainValue, collegeValue, skillLevelValue);
    };

    // table change
    const handleTableChange = (
        newPagination: TablePaginationConfig,
        filters: any,
        sorter: any
    ) => {
        // Handle filter changes from Antd table filters
        if (filters) {
            handleFilterChange(filters);
        }

        fetchPreferences(
            newPagination.current!,
            newPagination.pageSize!,
            debouncedSearch,
            selectedDomain,
            selectedCollege,
            selectedSkillLevel
        );
    };

    const handleClearFilters = () => {
        setSelectedDomain(undefined);
        setSelectedCollege(undefined);
        setSelectedSkillLevel(undefined);
        setPagination(prev => ({ ...prev, current: 1 }));
        fetchPreferences(1, pagination.pageSize!, debouncedSearch, undefined, undefined, undefined);
    };

    // Row click handler
    const handleRowClick = (record: DomainPreference) => {
        setSelectedPreference(record);
        setIsModalVisible(true);
    };

    // Modal handlers
    const handleCloseModal = () => {
        setIsModalVisible(false);
        setSelectedPreference(null);
    };

    // Get skill level color
    const getSkillLevelColor = (level: string) => {
        switch (level.toLowerCase()) {
            case 'beginner': return 'orange';
            case 'intermediate': return 'blue';
            case 'advanced': return 'green';
            default: return 'default';
        }
    };

    const columns: ColumnsType<DomainPreference> = [
        {
            title: "Name",
            dataIndex: "fullName",
            key: "name",
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
            dataIndex: "contactNumber",
            key: "contactNumber",
            width: 120,
            render: (contactNumber: string) => contactNumber || "-",
        },
        {
            title: "College",
            dataIndex: "collegeName",
            key: "collegeName",
            width: 200,
            filters: collegeFilters,
            filterDropdown: ({ close }) => (
                <div className="p-2 max-h-60 overflow-y-auto">
                    {collegeFilters.map((college) => (
                        <label
                            key={college.value}
                            className="flex items-center gap-2 px-2 py-1 hover:bg-accent rounded cursor-pointer"
                        >
                            <input
                                type="checkbox"
                                checked={selectedCollege === college.value}
                                onChange={(e) => {
                                    const value = e.target.checked ? college.value : undefined;
                                    setSelectedCollege(value);
                                    setPagination((p) => ({ ...p, current: 1 }));
                                    fetchPreferences(1, pagination.pageSize!, debouncedSearch, selectedDomain, value, selectedSkillLevel);
                                    close();
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
            render: (collegeName: string) => collegeName || "-",
        },
        {
            title: "Domain",
            dataIndex: "domain",
            key: "domain",
            width: 150,
            filters: domainFilters,
            filterDropdown: ({ close }) => (
                <div className="p-2 max-h-60 overflow-y-auto">
                    {domainFilters.map((domain) => (
                        <label
                            key={domain.value}
                            className="flex items-center gap-2 px-2 py-1 hover:bg-accent rounded cursor-pointer"
                        >
                            <input
                                type="checkbox"
                                checked={selectedDomain === domain.value}
                                onChange={(e) => {
                                    const value = e.target.checked ? domain.value : undefined;
                                    setSelectedDomain(value);
                                    setPagination((p) => ({ ...p, current: 1 }));
                                    fetchPreferences(1, pagination.pageSize!, debouncedSearch, value, selectedCollege, selectedSkillLevel);
                                    close();
                                }}
                            />
                            {domain.text}
                        </label>
                    ))}
                </div>
            ),
            filterIcon: () => (
                <FilterOutlined style={{ color: selectedDomain ? "#1677ff" : undefined }} />
            ),
            render: (domain: string) => domain || "-",
        },
        {
            title: "Skill Level",
            dataIndex: "skillLevel",
            key: "skillLevel",
            width: 140,
            ellipsis: true,
            filters: skillLevelFilters,
            filterDropdown: ({ close }) => (
                <div className="p-2 max-h-60 overflow-y-auto">
                    {skillLevelFilters.map((level) => (
                        <label
                            key={level.value}
                            className="flex items-center gap-2 px-2 py-1 hover:bg-accent rounded cursor-pointer"
                        >
                            <input
                                type="checkbox"
                                checked={selectedSkillLevel === level.value}
                                onChange={(e) => {
                                    const value = e.target.checked ? level.value : undefined;
                                    setSelectedSkillLevel(value);
                                    setPagination((p) => ({ ...p, current: 1 }));
                                    fetchPreferences(1, pagination.pageSize!, debouncedSearch, selectedDomain, selectedCollege, value);
                                    close();
                                }}
                            />
                            {level.text}
                        </label>
                    ))}
                </div>
            ),
            filterIcon: () => (
                <FilterOutlined style={{ color: selectedSkillLevel ? "#1677ff" : undefined }} />
            ),
            render: (skillLevel: string) => (
                <Tag color={getSkillLevelColor(skillLevel)}>
                    {skillLevel}
                </Tag>
            ),
        },
        // {
        //     title: "Technologies",
        //     dataIndex: "technologies",
        //     key: "technologies",
        //     width: 200,
        //     render: (technologies: string[]) => (
        //         <div className="flex flex-wrap gap-1">
        //             {technologies?.slice(0, 3).map((tech, index) => (
        //                 <Tag key={index} color="blue" className="text-xs">
        //                     {tech}
        //                 </Tag>
        //             ))}
        //             {technologies?.length > 3 && <Tag className="text-xs">+{technologies.length - 3}</Tag>}
        //             {(!technologies || technologies.length === 0) && '-'}
        //         </div>
        //     ),
        // },
        {
            title: "Applied",
            dataIndex: "timestamp",
            key: "timestamp",
            width: 100,
            render: (timestamp: string) => timestamp ? new Date(timestamp).toLocaleDateString() : "-",
        },
    ];

    return (
        <div className="p-6 space-y-4">

            {/* Header */}
            <div className="flex justify-between items-center">
                <div className="flex items-center gap-3">
                    <Title level={3} className="!mb-0">
                        Domain Preferences
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
                {(selectedDomain || selectedCollege || selectedSkillLevel) ? (
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <span className="text-sm text-muted-foreground">Active filters:</span>
                            {selectedDomain && (
                                <span className="inline-flex items-center gap-1 px-3 py-1 bg-secondary text-secondary-foreground rounded-full text-sm border border-border">
                                    Domain: {selectedDomain}
                                    <button
                                        onClick={() => {
                                            setSelectedDomain(undefined);
                                            setPagination((p) => ({ ...p, current: 1 }));
                                            fetchPreferences(1, pagination.pageSize!, debouncedSearch, undefined, selectedCollege, selectedSkillLevel);
                                        }}
                                        className="ml-1 text-muted-foreground hover:text-foreground transition-colors"
                                    >
                                        ×
                                    </button>
                                </span>
                            )}
                            {selectedCollege && (
                                <span className="inline-flex items-center gap-1 px-3 py-1 bg-secondary text-secondary-foreground rounded-full text-sm border border-border">
                                    College: {selectedCollege}
                                    <button
                                        onClick={() => {
                                            setSelectedCollege(undefined);
                                            setPagination((p) => ({ ...p, current: 1 }));
                                            fetchPreferences(1, pagination.pageSize!, debouncedSearch, selectedDomain, undefined, selectedSkillLevel);
                                        }}
                                        className="ml-1 text-muted-foreground hover:text-foreground transition-colors"
                                    >
                                        ×
                                    </button>
                                </span>
                            )}
                            {selectedSkillLevel && (
                                <span className="inline-flex items-center gap-1 px-3 py-1 bg-secondary text-secondary-foreground rounded-full text-sm border border-border">
                                    Skill Level: {selectedSkillLevel}
                                    <button
                                        onClick={() => {
                                            setSelectedSkillLevel(undefined);
                                            setPagination((p) => ({ ...p, current: 1 }));
                                            fetchPreferences(1, pagination.pageSize!, debouncedSearch, selectedDomain, selectedCollege, undefined);
                                        }}
                                        className="ml-1 text-muted-foreground hover:text-foreground transition-colors"
                                    >
                                        ×
                                    </button>
                                </span>
                            )}
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
                    dataSource={preferences}
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
                            `${range[0]}-${range[1]} of ${total} preferences`,
                    }}
                    scroll={{ y: "calc(100vh - 350px)" }}
                    locale={{
                        emptyText: loading ? 'Loading...' : 'No domain preferences found'
                    }}
                />
            </div>

            {/* Details Modal */}
            <Modal
                title="Domain Preference Details"
                open={isModalVisible}
                onCancel={handleCloseModal}
                footer={null}
                width={800}
                centered
            >
                {selectedPreference && (
                    <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <p className="font-semibold">Full Name:</p>
                                <p>{selectedPreference.fullName}</p>
                            </div>
                            <div>
                                <p className="font-semibold">Email:</p>
                                <p>{selectedPreference.email}</p>
                            </div>
                            <div>
                                <p className="font-semibold">Contact Number:</p>
                                <p>{selectedPreference.contactNumber}</p>
                            </div>
                            <div>
                                <p className="font-semibold">College:</p>
                                <p>{selectedPreference.collegeName}</p>
                            </div>
                            <div>
                                <p className="font-semibold">Year of Study:</p>
                                <p>{selectedPreference.yearOfStudy}</p>
                            </div>
                            <div>
                                <p className="font-semibold">Domain:</p>
                                <p>{selectedPreference.domain}</p>
                            </div>
                            <div>
                                <p className="font-semibold">Skill Level:</p>
                                <Tag color={getSkillLevelColor(selectedPreference.skillLevel)}>
                                    {selectedPreference.skillLevel}
                                </Tag>
                            </div>
                            <div>
                                <p className="font-semibold">Applied Date:</p>
                                <p>{new Date(selectedPreference.timestamp).toLocaleDateString()}</p>
                            </div>
                        </div>
                        <div>
                            <p className="font-semibold">Technologies:</p>
                            <div className="flex flex-wrap gap-1 mt-1">
                                {selectedPreference.technologies.map((tech, index) => (
                                    <Tag key={index} color="blue">
                                        {tech}
                                    </Tag>
                                ))}
                            </div>
                        </div>
                        <div>
                            <p className="font-semibold">Interest Reason:</p>
                            <p className="text-sm text-gray-700">{selectedPreference.interestReason}</p>
                        </div>
                    </div>
                )}
            </Modal>

            {/* Summary Modal */}
            <DomainPreferenceSummaryModal
                visible={summaryModalVisible}
                onClose={() => setSummaryModalVisible(false)}
            />
        </div>
    );
}
