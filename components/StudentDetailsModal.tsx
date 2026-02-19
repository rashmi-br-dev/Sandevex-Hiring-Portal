"use client";

import { Modal, Button, Descriptions, Tag, Avatar, Divider, Tooltip, message, Typography } from "antd";
import {
    UserOutlined, MailOutlined, PhoneOutlined,
    EnvironmentOutlined, LinkOutlined, CheckCircleOutlined,
    CloseCircleOutlined, CopyOutlined
} from "@ant-design/icons";

const { Title, Text } = Typography;

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

interface StudentDetailsModalProps {
    visible: boolean;
    student: Student | null;
    onClose: () => void;
    offerStatuses: Record<string, string>;
    onSendOffer?: (studentId: string, email: string) => Promise<void>;
}

export default function StudentDetailsModal({
    visible,
    student,
    onClose,
    offerStatuses,
    onSendOffer
}: StudentDetailsModalProps) {

    const handleCopyJSON = () => {
        if (student) {
            const jsonString = JSON.stringify(student, null, 2);
            navigator.clipboard.writeText(jsonString);
            message.success('Student data copied to clipboard');
        }
    };

    if (!student) return null;

    return (
        <Modal
            title={
                <div className="flex justify-between items-center">
                    <span>Candidate Details</span>
                    <Tooltip title="Copy as JSON">
                        <Button
                            icon={<CopyOutlined />}
                            onClick={handleCopyJSON}
                            size="small"
                            style={{
                                backgroundColor: '#1890ff',
                                borderColor: '#1890ff',
                                color: '#fff',
                                marginRight: '30px'
                            }}
                        >
                            Copy JSON
                        </Button>
                    </Tooltip>
                </div>
            }
            open={visible}
            onCancel={onClose}
            centered
            footer={[
                <Button key="close" onClick={onClose}>
                    Close
                </Button>,
                student?.portfolioUrl && (
                    <Button
                        key="portfolio"
                        icon={<LinkOutlined />}
                        href={student.portfolioUrl}
                        target="_blank"
                    >
                        View Portfolio
                    </Button>
                ),
                offerStatuses[student._id] !== 'sent' && onSendOffer && (
                    <Button
                        key="sendOffer"
                        type="primary"
                        onClick={() => onSendOffer(student._id, student.email)}
                        style={{ backgroundColor: '#52c41a', borderColor: '#52c41a' }}
                    >
                        Send Offer
                    </Button>
                )
            ]}
            width={800}
            styles={{
                body: {
                    maxHeight: '70vh',
                    overflowY: 'auto',
                    padding: '20px 24px'
                }
            }}
        >
            <div className="mt-4">
                <div className="flex justify-between items-start mb-6">
                    <div className="flex items-start">
                        <Avatar
                            size={64}
                            icon={<UserOutlined />}
                            src={`https://ui-avatars.com/api/?name=${encodeURIComponent(student.fullName)}&size=128&background=1890ff&color=fff`}
                            className="mr-4"
                        />
                        <div>
                            <Title level={4} className="mb-1">{student.fullName}</Title>
                            <div className="flex items-center text-gray-500 mb-2">
                                <MailOutlined className="mr-2" />
                                {student.email}
                            </div>
                            <div className="flex items-center text-gray-500 mb-2">
                                <PhoneOutlined className="mr-2" />
                                {student.mobile || 'N/A'}
                            </div>
                            <div className="flex items-center text-gray-500">
                                <EnvironmentOutlined className="mr-2" />
                                {student.cityState || 'Location not specified'}
                            </div>
                        </div>
                    </div>
                    <div>
                        <Tag
                            icon={
                                offerStatuses[student._id] === 'sent'
                                    ? <CheckCircleOutlined />
                                    : <CloseCircleOutlined />
                            }
                            color={
                                offerStatuses[student._id] === 'sent'
                                    ? 'success'
                                    : 'default'
                            }
                        >
                            {offerStatuses[student._id] === 'sent'
                                ? 'Offer Sent'
                                : 'Pending'}
                        </Tag>
                    </div>
                </div>

                {/* Education Section */}
                <Divider />
                <Title level={5}>Education</Title>
                <Descriptions column={2} className="mb-4">
                    <Descriptions.Item label="College">{student.collegeName}</Descriptions.Item>
                    <Descriptions.Item label="Degree">{student.degree || 'N/A'}</Descriptions.Item>
                    <Descriptions.Item label="Branch">{student.branch || 'N/A'}</Descriptions.Item>
                    <Descriptions.Item label="Year of Study">{student.yearOfStudy || 'N/A'}</Descriptions.Item>
                </Descriptions>

                {/* Skills & Experience Section */}
                <Divider />
                <Title level={5}>Skills & Experience</Title>
                <div className="mb-4">
                    <div className="mb-2">
                        <Text strong>Technical Skills:</Text>
                        <div className="mt-2">
                            {student.technicalSkills?.map((skill, index) => (
                                <Tag key={index} color="blue" className="mb-1 mr-1">
                                    {skill}
                                </Tag>
                            )) || 'No skills listed'}
                        </div>
                    </div>
                    <div className="mt-3">
                        <Text strong>Skills Count: </Text>
                        <Tag color="purple">{student.technicalSkills?.length || 0} skills</Tag>
                    </div>
                </div>

                {student.priorExperience && (
                    <div className="mb-4">
                        <Text strong>Prior Experience:</Text>
                        <div className="mt-1 p-3 bg-gray-50 dark:bg-gray-900 rounded">
                            <Text>{student.priorExperience}</Text>
                        </div>
                    </div>
                )}

                {/* Why Sandevex Section */}
                <Divider />
                <Title level={5}>Why Sandevex?</Title>
                <div className="mb-4 p-3 bg-gray-50 dark:bg-gray-900 rounded">
                    <Text>{student.whySandevex || 'Not specified'}</Text>
                </div>
            </div>
        </Modal>
    );
}