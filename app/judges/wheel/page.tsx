"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Trash2, Edit, Plus, RefreshCcw, PlayCircle, X, PartyPopper } from "lucide-react"

type WheelItem = {
  id: string
  label: string
  color?: string
}

function randomColor() {
  const hue = Math.floor(Math.random() * 360)
  return `hsl(${hue}, 80%, 50%)`
}

const DEFAULT_ITEMS: WheelItem[] = [
  { id: "1", label: "10 điểm" },
]

export default function JudgesWheelPage() {
  const [items, setItems] = useState<WheelItem[]>([])
  const [label, setLabel] = useState("")
  const [editingId, setEditingId] = useState<string | null>(null)
  const [spinning, setSpinning] = useState(false)
  const [result, setResult] = useState<WheelItem | null>(null)
  const [openResult, setOpenResult] = useState(false)
  const [showCelebration, setShowCelebration] = useState(false)


  // Persist to localStorage
  useEffect(() => {
    try {
      const raw = localStorage.getItem("judges_wheel_items")
      if (raw) {
        const parsed: WheelItem[] = JSON.parse(raw)
        setItems(parsed.map(it => ({ ...it, color: it.color || randomColor() })))
      } else {
        setItems(DEFAULT_ITEMS.map(it => ({ ...it, color: randomColor() })))
      }
    } catch {}
  }, [])
  useEffect(() => {
    try {
      localStorage.setItem("judges_wheel_items", JSON.stringify(items))
    } catch {}
  }, [items])

  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const size = 360
  const radius = size / 2

  const segments = useMemo(() => items.length, [items])
  const anglePerSegment = useMemo(() => (Math.PI * 2) / Math.max(1, segments), [segments])

  // Draw wheel
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext("2d")
    if (!ctx) return

    ctx.clearRect(0, 0, size, size)
    ctx.save()
    ctx.translate(radius, radius)

    items.forEach((item, index) => {
      const start = index * anglePerSegment
      const end = start + anglePerSegment
      ctx.beginPath()
      ctx.moveTo(0, 0)
      ctx.arc(0, 0, radius - 4, start, end)
      ctx.closePath()
      ctx.fillStyle = item.color || `hsl(${(index * 360) / Math.max(1, segments)}, 80%, 50%)`
      ctx.fill()

      // text
      ctx.save()
      ctx.rotate(start + anglePerSegment / 2)
      ctx.fillStyle = "#fff"
      ctx.font = "bold 14px system-ui, -apple-system, Segoe UI, Roboto"
      ctx.textAlign = "right"
      ctx.fillText(item.label, radius - 16, 4)
      ctx.restore()
    })

    ctx.restore()
    // pointer
    ctx.beginPath()
    ctx.moveTo(radius, 6)
    ctx.lineTo(radius + 18, 0)
    ctx.lineTo(radius, -6)
    ctx.closePath()
    ctx.fillStyle = "#ef4444"
    ctx.fill()
  }, [items, anglePerSegment, radius, size])

  function resetForm() {
    setLabel("")
    setEditingId(null)
  }

  function addOrUpdateItem(e: React.FormEvent) {
    e.preventDefault()
    const cleanLabel = label.replace(/\s+/g, " ").trim()
    if (!cleanLabel) return
    if (editingId) {
      setItems((prev) => prev.map((it) => (it.id === editingId ? { ...it, label: cleanLabel } : it)))
    } else {
      setItems((prev) => [...prev, { id: crypto.randomUUID(), label: cleanLabel, color: randomColor() }])
    }
    resetForm()
  }

  function editItem(id: string) {
    const it = items.find((x) => x.id === id)
    if (!it) return
    setEditingId(id)
    setLabel(it.label)
  }

  function deleteItem(id: string) {
    setItems((prev) => prev.filter((x) => x.id !== id))
    if (editingId === id) resetForm()
    if (result?.id === id) {
      setResult(null)
      setOpenResult(false)
      setShowCelebration(false)
    }
  }

  async function spinWheel() {
    if (items.length === 0 || spinning) return
    setSpinning(true)
    setResult(null)
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext("2d") as CanvasRenderingContext2D
    if (!ctx) return

    let currentRotation = 0
    const totalRotation = Math.PI * 6 + Math.random() * Math.PI * 2
    const duration = 3000
    const start = performance.now()

    return new Promise<void>((resolve) => {
      function frame(now: number) {
        const elapsed = now - start
        const t = Math.min(1, elapsed / duration)
        const easeOut = 1 - Math.pow(1 - t, 3)
        const target = totalRotation * easeOut
        const delta = target - currentRotation
        currentRotation = target

        // redraw
        ctx.clearRect(0, 0, size, size)
        ctx.save()
        ctx.translate(radius, radius)
        ctx.rotate(currentRotation)

        items.forEach((item, index) => {
          const startA = index * anglePerSegment
          const endA = startA + anglePerSegment
          ctx.beginPath()
          ctx.moveTo(0, 0)
          ctx.arc(0, 0, radius - 4, startA, endA)
          ctx.closePath()
          ctx.fillStyle = item.color || `hsl(${(index * 360) / Math.max(1, segments)}, 80%, 50%)`
          ctx.fill()

          ctx.save()
          ctx.rotate(startA + anglePerSegment / 2)
          ctx.fillStyle = "#fff"
          ctx.font = "bold 14px system-ui, -apple-system, Segoe UI, Roboto"
          ctx.textAlign = "right"
          ctx.fillText(item.label, radius - 16, 4)
          ctx.restore()
        })

        ctx.restore()
        // pointer
        ctx.beginPath()
        ctx.moveTo(radius, 6)
        ctx.lineTo(radius + 18, 0)
        ctx.lineTo(radius, -6)
        ctx.closePath()
        ctx.fillStyle = "#ef4444"
        ctx.fill()

        if (t < 1) {
          requestAnimationFrame(frame)
        } else {
          // determine result at pointer (angle 0)
          const normalized = currentRotation % (Math.PI * 2)
          const index = Math.floor(((Math.PI * 2 - normalized) % (Math.PI * 2)) / anglePerSegment) % Math.max(1, segments)
          const winner = items[index]
          setResult(winner)
          setShowCelebration(true)
          setOpenResult(true)
          setSpinning(false)
          resolve()
        }
      }
      requestAnimationFrame(frame)
    })
  }

  return (
    <div className="min-h-screen bg-background relative">
      {/* Hiệu ứng chúc mừng */}
      {showCelebration && (
        <div className="fixed inset-0 pointer-events-none z-50">
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="animate-bounce text-6xl">
              <PartyPopper className="text-yellow-400" />
            </div>
          </div>
          <div className="absolute top-1/4 left-1/4 animate-bounce delay-100 text-4xl">
            <PartyPopper className="text-pink-400" />
          </div>
          <div className="absolute top-1/3 right-1/4 animate-bounce delay-200 text-5xl">
            <PartyPopper className="text-green-400" />
          </div>
          <div className="absolute bottom-1/3 left-1/3 animate-bounce delay-300 text-3xl">
            <PartyPopper className="text-blue-400" />
          </div>
          <div className="absolute bottom-1/4 right-1/3 animate-bounce delay-500 text-4xl">
            <PartyPopper className="text-purple-400" />
          </div>
        </div>
      )}
      <header className="bg-gradient-to-r from-primary to-secondary text-white py-6">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold">Random Wheel - Giám Khảo</h1>
            </div>
          </div>
        </div>
      </header>

      <section className="py-10">
        <div className="container mx-auto px-4 grid lg:grid-cols-2 gap-8 items-start">
          <Card className="hover-lift hover-glow transition-all duration-300">
            <CardHeader>
              <CardTitle className="text-primary">Vòng quay</CardTitle>
              <CardDescription>Nhấn quay để chọn ngẫu nhiên</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col items-center gap-6">
                <canvas ref={canvasRef} width={size} height={size} className="rounded-full bg-primary/5 border border-primary/20 shadow-lg" />
                <div className="flex gap-3">
                  <Button onClick={spinWheel} disabled={spinning || items.length === 0} className="px-6">
                    <PlayCircle className="w-4 h-4 mr-2" /> Quay
                  </Button>
                  <Button variant="outline" onClick={() => setItems(DEFAULT_ITEMS)} disabled={spinning}>
                    <RefreshCcw className="w-4 h-4 mr-2" /> Reset mặc định
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="hover-lift hover-glow transition-all duration-300">
            <CardHeader>
              <CardTitle className="text-primary">Danh sách mục</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={addOrUpdateItem} className="grid sm:grid-cols-3 gap-3 mb-6">
                <div className="sm:col-span-3">
                  <Label htmlFor="label">Thêm mục</Label>
                  <Input id="label" value={label} onChange={(e) => setLabel(e.target.value)} placeholder="Ví dụ: 10 điểm" />
                </div>
                <div className="sm:col-span-3 flex gap-3">
                  <Button type="submit" className="px-6">
                    {editingId ? (
                      <>
                        <Edit className="w-4 h-4 mr-2" /> Cập nhật
                      </>
                    ) : (
                      <>
                        <Plus className="w-4 h-4 mr-2" /> Thêm mục
                      </>
                    )}
                  </Button>
                  {editingId ? (
                    <Button type="button" variant="outline" onClick={resetForm}>Hủy</Button>
                  ) : null}
                </div>
              </form>

              <div className="grid gap-3">
                {items.map((it) => (
                  <div key={it.id} className="flex items-center justify-between p-3 rounded-md border bg-background">
                    <div className="flex items-center gap-3">
                      <span className="inline-block w-4 h-4 rounded-sm border" style={{ backgroundColor: it.color || "#999" }} />
                      <span className="font-medium">{it.label}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button variant="outline" size="sm" onClick={() => editItem(it.id)}>
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button variant="destructive" size="sm" onClick={() => deleteItem(it.id)}>
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                ))}
                {items.length === 0 && (
                  <p className="text-sm text-muted-foreground">Chưa có mục nào. Hãy thêm mục để bắt đầu.</p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      <Dialog open={openResult} onOpenChange={(open) => {
        setOpenResult(open)
        if (!open) {
          setShowCelebration(false)
        }
      }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <PartyPopper className="w-5 h-5 text-yellow-500" />
              Chúc mừng!
            </DialogTitle>
            <DialogDescription>Mục trúng thưởng</DialogDescription>
          </DialogHeader>
          <div className="flex items-center gap-3 py-4">
            <span className="inline-block w-6 h-6 rounded-sm border" style={{ backgroundColor: result?.color || "#999" }} />
            <span className="font-semibold text-lg">{result?.label}</span>
          </div>
          <DialogFooter className="flex gap-2">
            <Button 
              variant="destructive" 
              onClick={() => {
                if (result) {
                  deleteItem(result.id)
                }
              }}
              className="flex items-center gap-2"
            >
              <Trash2 className="w-4 h-4" />
              Xóa mục này
            </Button>
            <Button 
              variant="outline" 
              onClick={() => {
                setOpenResult(false)
                setShowCelebration(false)
              }}
              className="flex items-center gap-2"
            >
              <X className="w-4 h-4" />
              Đóng
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}


