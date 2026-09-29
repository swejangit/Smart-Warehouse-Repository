import React from 'react';

interface LoadingStateProps {
  message?: string;
}

export const ReceivingLoadingState: React.FC<LoadingStateProps> = ({
  message = 'Loading Receiving Queue...',
}) => (
  <div className="card shadow-sm border-0 p-5 text-center my-4">
    <div className="d-flex flex-column align-items-center justify-content-center py-4">
      <div className="spinner-border text-primary mb-3" role="status" style={{ width: '2.5rem', height: '2.5rem' }}>
        <span className="visually-hidden">Loading...</span>
      </div>
      <h5 className="fw-semibold text-dark mb-1">{message}</h5>
      <p className="text-muted fs-7 mb-0">Communicating with receiving service...</p>
    </div>
  </div>
);

interface ErrorStateProps {
  title?: string;
  message?: string;
  onRetry: () => void;
}

export const ReceivingErrorState: React.FC<ErrorStateProps> = ({
  title = 'Unable to Load Receiving Records',
  message = 'Something went wrong while retrieving receiving data.',
  onRetry,
}) => (
  <div className="card shadow-sm border-0 p-5 text-center my-4 border-start border-4 border-danger">
    <div className="mb-3">
      <div className="bg-danger-subtle text-danger rounded-circle d-inline-flex align-items-center justify-content-center p-3">
        <i className="bi bi-exclamation-triangle-fill fs-2"></i>
      </div>
    </div>
    <h4 className="fw-bold text-dark mb-2">{title}</h4>
    <p className="text-muted mb-4 fs-7 mx-auto" style={{ maxWidth: '420px' }}>{message}</p>
    <div>
      <button
        type="button"
        className="btn btn-primary rounded-3 px-4 py-2 fw-semibold d-inline-flex align-items-center gap-2 shadow-sm"
        onClick={onRetry}
      >
        <i className="bi bi-arrow-clockwise"></i>
        <span>Retry</span>
      </button>
    </div>
  </div>
);

interface EmptyQueueStateProps {
  title?: string;
  message?: string;
  onRefresh?: () => void;
}

export const ReceivingEmptyQueueState: React.FC<EmptyQueueStateProps> = ({
  title = 'No Receiving Records',
  message = 'Currently there are no eligible receiving records available.',
  onRefresh,
}) => (
  <div className="card shadow-sm border-0 p-5 text-center my-4">
    <div className="mb-3">
      <div className="bg-light text-secondary rounded-circle d-inline-flex align-items-center justify-content-center p-3">
        <i className="bi bi-inbox fs-2"></i>
      </div>
    </div>
    <h4 className="fw-bold text-dark mb-2">{title}</h4>
    <p className="text-muted mb-4 fs-7 mx-auto" style={{ maxWidth: '420px' }}>{message}</p>
    {onRefresh && (
      <div>
        <button
          type="button"
          className="btn btn-outline-primary rounded-3 px-4 py-2 fw-semibold d-inline-flex align-items-center gap-2"
          onClick={onRefresh}
        >
          <i className="bi bi-arrow-clockwise"></i>
          <span>Refresh Queue</span>
        </button>
      </div>
    )}
  </div>
);

interface NoSearchResultsStateProps {
  title?: string;
  message?: string;
  onClearFilters: () => void;
}

export const ReceivingNoResultsState: React.FC<NoSearchResultsStateProps> = ({
  title = 'No Results Found',
  message = 'Try changing your search or filters.',
  onClearFilters,
}) => (
  <div className="p-5 text-center my-3">
    <div className="mb-3">
      <div className="bg-light text-muted rounded-circle d-inline-flex align-items-center justify-content-center p-3">
        <i className="bi bi-search fs-2"></i>
      </div>
    </div>
    <h5 className="fw-bold text-dark mb-2">{title}</h5>
    <p className="text-muted mb-4 fs-7">{message}</p>
    <div>
      <button
        type="button"
        className="btn btn-outline-primary btn-sm rounded-3 px-3 py-1.5 fw-semibold d-inline-flex align-items-center gap-1.5"
        onClick={onClearFilters}
      >
        <i className="bi bi-x-circle"></i>
        <span>Clear Filters</span>
      </button>
    </div>
  </div>
);
