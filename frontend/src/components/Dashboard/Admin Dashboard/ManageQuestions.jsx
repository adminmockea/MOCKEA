import { useNavigate } from "react-router";
import useManageQuestions from "../../../hooks/useManageQuestions";
import TableShell from "../../Common/TableShell";
import QuestionsToolbar from "./ManageQuestions/QuestionsToolbar";
import QuestionsTable from "./ManageQuestions/QuestionsTable";
import QuestionsGrid from "./ManageQuestions/QuestionsGrid";
import QuestionDetailModal from "./ManageQuestions/QuestionDetailModal";

const ManageQuestions = () => {
    const navigate = useNavigate();
    const {
        filteredQuestions,
        uniqueTypes,
        isLoading,
        isError,
        refetch,
        selectedQuestion,
        setSelectedQuestion,
        viewMode,
        setViewMode,
        filterType,
        setFilterType,
        filterPlan,
        setFilterPlan,
        filterStatus,
        setFilterStatus,
        filterMockStatus,
        setFilterMockStatus,
        isFilterOpen,
        setIsFilterOpen,
        selectedIds,
        setSelectedIds,
        searchQuery,
        setSearchQuery,
        handleToggleStatus,
        handleDelete,
        handleSelectRow,
        handleSelectAll,
        handleBulkAction
    } = useManageQuestions();

    return (
        <div className="space-y-6">
            <QuestionsToolbar
                searchQuery={searchQuery}
                setSearchQuery={setSearchQuery}
                isFilterOpen={isFilterOpen}
                setIsFilterOpen={setIsFilterOpen}
                filterType={filterType}
                setFilterType={setFilterType}
                filterPlan={filterPlan}
                setFilterPlan={setFilterPlan}
                filterStatus={filterStatus}
                setFilterStatus={setFilterStatus}
                filterMockStatus={filterMockStatus}
                setFilterMockStatus={setFilterMockStatus}
                uniqueTypes={uniqueTypes}
                viewMode={viewMode}
                setViewMode={setViewMode}
                selectedIds={selectedIds}
                handleBulkAction={handleBulkAction}
            />

            <TableShell
                isLoading={isLoading}
                isError={isError}
                errorText="Failed to load questions"
                onRetry={refetch}
                empty={filteredQuestions.length === 0}
                emptyTitle="No Question Sets Found"
                emptyText="There are no question sets in the bank at this time."
                transparent={viewMode === "grid"}
            >
                {viewMode === "table" ? (
                    <QuestionsTable
                        filteredQuestions={filteredQuestions}
                        selectedIds={selectedIds}
                        handleSelectAll={handleSelectAll}
                        handleSelectRow={handleSelectRow}
                        handleToggleStatus={handleToggleStatus}
                        handleDelete={handleDelete}
                        setSelectedQuestion={setSelectedQuestion}
                        navigate={navigate}
                    />
                ) : (
                    <QuestionsGrid
                        filteredQuestions={filteredQuestions}
                        selectedIds={selectedIds}
                        handleSelectRow={handleSelectRow}
                        handleToggleStatus={handleToggleStatus}
                        handleDelete={handleDelete}
                        setSelectedQuestion={setSelectedQuestion}
                        navigate={navigate}
                    />
                )}
            </TableShell>

            <QuestionDetailModal
                selectedQuestion={selectedQuestion}
                setSelectedQuestion={setSelectedQuestion}
                navigate={navigate}
                handleBulkAction={handleBulkAction}
                selectedIds={selectedIds}
                setSelectedIds={setSelectedIds}
            />
        </div>
    );
};

export default ManageQuestions;
