import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog'
import { Button } from './ui/button'

export function ConfirmDialog({ open, onClose, title, description, onConfirm }) {
  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) onClose() }}>
      <DialogContent showCloseButton={false}>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          {description && <p className="text-sm text-muted-foreground mt-1">{description}</p>}
        </DialogHeader>
        <div className="flex justify-end gap-2 mt-2">
          <Button variant="outline" onClick={onClose}>キャンセル</Button>
          <Button
            className="bg-destructive text-white hover:bg-destructive/90"
            onClick={() => { onConfirm(); onClose() }}
          >
            削除
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
