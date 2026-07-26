import { AnimatePresence } from "framer-motion";
import useAuth from "../../../hooks/useAuth";
import useGradeSubmissions from "../../../hooks/useGradeSubmissions";
import GradeSubmissionsHeader from "./GradeSubmissions/GradeSubmissionsHeader";
import MockTestSubmissionsTable from "./GradeSubmissions/MockTestSubmissionsTable";
import SkillLabSubmissionsTable from "./GradeSubmissions/SkillLabSubmissionsTable";
import GradingModalContainer from "./GradeSubmissions/GradingModal/GradingModalContainer";

const GradeSubmissions = () => {
    const { user } = useAuth();
    const {
        activeTab,
        setActiveTab,
        mockEvalDetail,
        setMockEvalDetail,
        mockReviewData,
        setMockReviewData,
        isEditingMockGrade,
        setIsEditingMockGrade,
        results,
        loadingMock,
        handleOpenMockEval,
        handleMockReviewSubmit,
        selectedSubmission,
        setSelectedSubmission,
        reviewData,
        setReviewData,
        submitting,
        filter,
        setFilter,
        submissions,
        handleReviewSubmit
    } = useGradeSubmissions();

    return (
        <div className="space-y-10 p-2">
            <GradeSubmissionsHeader 
                activeTab={activeTab} 
                setActiveTab={setActiveTab} 
                isSubmissionSelected={!!selectedSubmission} 
            />

            <AnimatePresence mode="wait">
                {activeTab === "mock-tests" ? (
                    <MockTestSubmissionsTable 
                        key="mock"
                        loadingMock={loadingMock}
                        results={results}
                        user={user}
                        handleOpenMockEval={handleOpenMockEval}
                    />
                ) : (
                    <SkillLabSubmissionsTable 
                        key="labs"
                        submissions={submissions}
                        filter={filter}
                        setFilter={setFilter}
                        selectedSubmission={selectedSubmission}
                        setSelectedSubmission={setSelectedSubmission}
                        user={user}
                        reviewData={reviewData}
                        setReviewData={setReviewData}
                        submitting={submitting}
                        handleReviewSubmit={handleReviewSubmit}
                    />
                )}
            </AnimatePresence>

            <GradingModalContainer 
                mockEvalDetail={mockEvalDetail}
                setMockEvalDetail={setMockEvalDetail}
                mockReviewData={mockReviewData}
                setMockReviewData={setMockReviewData}
                isEditingMockGrade={isEditingMockGrade}
                setIsEditingMockGrade={setIsEditingMockGrade}
                handleMockReviewSubmit={handleMockReviewSubmit}
                submitting={submitting}
            />
        </div>
    );
};

export default GradeSubmissions;
