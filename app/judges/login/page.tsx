"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"

export default function JudgeLoginPage() {
  const router = useRouter()
  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Đảm bảo luôn hiện form: xóa trạng thái đăng nhập cũ (nếu có)
  useEffect(() => {
    try {
      sessionStorage.removeItem("judge_user")
    } catch {}
  }, [])

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(null)
    setIsSubmitting(true)
    try {
      const url = new URL("https://unibackend.iuptit.com/api/v1/judges/judges/authenticate")
      url.searchParams.set("username", username)
      url.searchParams.set("password", password)

      const res = await fetch(url.toString(), {
        method: "POST",
        headers: {
          accept: "application/json",
        },
      })

      if (!res.ok) {
        const text = await res.text()
        throw new Error(text || `Đăng nhập thất bại (${res.status})`)
      }

      const data = await res.json()
      if (!data?.success || !data?.data) {
        throw new Error(data?.message || "Thông tin đăng nhập không hợp lệ")
      }

      // Lưu thông tin cơ bản vào sessionStorage (tạm thời). Có thể thay bằng cookie/token khi backend cung cấp
      sessionStorage.setItem("judge_user", JSON.stringify(data.data))

      router.push("/judges/dashboard")
    } catch (err: any) {
      setError(err?.message || "Có lỗi xảy ra. Vui lòng thử lại")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Đăng nhập Giám khảo</CardTitle>
          <CardDescription>Nhập tên đăng nhập và mật khẩu để tiếp tục</CardDescription>
        </CardHeader>
        <CardContent>
          {error ? (
            <Alert variant="destructive" className="mb-4">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          ) : null}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="username">Tên đăng nhập</Label>
              <Input
                id="username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="username"
                required
                autoComplete="username"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Mật khẩu</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                autoComplete="current-password"
              />
            </div>
            <Button type="submit" className="w-full" disabled={isSubmitting}>
              {isSubmitting ? "Đang đăng nhập..." : "Đăng nhập"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}


