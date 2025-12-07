import { Modal, Button } from 'react-bootstrap';
import { UserMinus } from 'lucide-react';

const UnfriendModal = ({ show, onHide, friend, onConfirm, loading }) => {
    if (!friend) return null;

    return (
        <Modal show={show} onHide={onHide} centered>
            <Modal.Header closeButton>
                <Modal.Title>
                    <UserMinus className="me-2" size={24} />
                    Unfriend {friend.displayName}?
                </Modal.Title>
            </Modal.Header>

            <Modal.Body>
                <p>Are you sure you want to remove <strong>{friend.displayName}</strong> from your friends list?</p>
                <p className="text-muted mb-0">
                    You can always send them a friend request again later.
                </p>
            </Modal.Body>

            <Modal.Footer>
                <Button
                    variant="outline-secondary"
                    onClick={onHide}
                    disabled={loading}
                >
                    Cancel
                </Button>
                <Button
                    variant="danger"
                    onClick={onConfirm}
                    disabled={loading}
                >
                    {loading ? 'Removing...' : 'Unfriend'}
                </Button>
            </Modal.Footer>
        </Modal>
    );
};

export default UnfriendModal;
