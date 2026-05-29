import { Search, Bell } from "lucide-react"
import { Input } from "@/components/ui/input"

export default function Header() {
  return (
    <header className="bg-white border-b border-gray-200 py-3 px-4 flex items-center justify-between">
      <div className="flex-1"></div>
      <div className="flex items-center space-x-4">
        <div className="relative">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
          <Input
            type="search"
            placeholder="Search regulations..."
            className="w-64 pl-9 h-9 rounded-md border border-gray-300"
          />
        </div>
        <div className="relative">
          <Bell className="h-5 w-5 text-gray-500" />
          <span className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-red-600 text-white text-xs flex items-center justify-center">
            3
          </span>
        </div>
        <div className="flex items-center space-x-2">
          <div className="h-8 w-8 rounded-full bg-gray-300 flex items-center justify-center text-sm font-medium text-gray-700">
            SJ
          </div>
          <div>
            <div className="text-sm font-medium">Sarah Johnson</div>
            <div className="text-xs text-gray-500">Compliance Officer</div>
          </div>
        </div>
      </div>
    </header>
  )
}
