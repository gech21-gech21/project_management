// app/admin/departments/page.tsx
"use client";

import { useSession } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState, Suspense } from "react";
import { Building2, Plus, Search, AlertCircle, Edit2, Trash2, ShieldCheck, Users, ArrowRight } from "lucide-react";
import Link from "next/link";
import DepartmentModal from "../../components/admin/DepartmentModal";
import DeleteConfirmationModal from "../../components/admin/DeleteConfirmationModal";

interface Department {
  id: string;
  name: string;
  code: string | null;
  description: string | null;
  createdAt: string;
  updatedAt: string;
  _count?: {
    users: number;
    teams: number;
  };
  head?: {
    id: string;
    fullName: string;
    email: string;
  } | null;
}

export default function DepartmentsPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <DepartmentsContent />
    </Suspense>
  );
}

function DepartmentsContent() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [selectedDepartment, setSelectedDepartment] = useState<Department | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [departmentToDelete, setDepartmentToDelete] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    if (status === "loading") return;

    if (!session?.user) {
      router.push("/auth");
      return;
    }

    if (session.user.role !== "ADMIN") {
      router.push("/dashboard");
      return;
    }

    if (session.user.role === "ADMIN") {
      fetchDepartments();
      
      // Handle ?create=true
      if (searchParams.get("create") === "true") {
        setShowModal(true);
      }
    }
  }, [session, status, router, searchParams]);

  const fetchDepartments = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/admin/departments");
      if (!response.ok) {
        throw new Error("Failed to fetch departments");
      }
      const data = await response.json();
      setDepartments(data.data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load departments");
    } finally {
      setLoading(false);
    }
  };

  const handleCreateDepartment = () => {
    setSelectedDepartment(null);
    setShowModal(true);
  };

  const handleEditDepartment = (department: Department) => {
    setSelectedDepartment(department);
    setShowModal(true);
  };

  const handleDeleteClick = (departmentId: string) => {
    setDepartmentToDelete(departmentId);
    setShowDeleteModal(true);
  };

  const handleDeleteConfirm = async () => {
    if (!departmentToDelete) return;

    try {
      const response = await fetch(`/api/admin/departments/${departmentToDelete}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Failed to delete department");
      }

      await fetchDepartments();
      setShowDeleteModal(false);
      setDepartmentToDelete(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete department");
    }
  };

  const filteredDepartments = departments.filter(dept =>
    dept.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (dept.code?.toLowerCase() || "").includes(searchTerm.toLowerCase()) ||
    (dept.description?.toLowerCase() || "").includes(searchTerm.toLowerCase())
  );

  if (status === "loading" || loading) {
    return (
      <div className="min-h-screen bg-white dark:bg-[#0a0a0a] flex items-center justify-center transition-colors duration-300">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-xs font-black text-gray-400 uppercase tracking-[0.3em] animate-pulse">Initializing Nexus...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white dark:bg-[#0a0a0a] transition-colors duration-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-12 flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-gray-100 dark:border-white/5 pb-8">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <div className="p-1.5 bg-blue-500/10 rounded-lg">
                <Building2 className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              </div>
              <span className="text-[10px] font-black text-blue-600 dark:text-blue-400 uppercase tracking-[0.2em]">Structural Nodes</span>
            </div>
            <h1 className="text-4xl font-black text-gray-900 dark:text-white tracking-tighter uppercase italic">
              Departments <span className="text-blue-600">Nexus</span>
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-2 font-medium">
              Manage departmental structures, organizational hierarchy, and node assignments.
            </p>
          </div>
          <button
            onClick={handleCreateDepartment}
            className="px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-all flex items-center gap-2 text-xs font-black uppercase tracking-widest shadow-[0_0_20px_rgba(37,99,235,0.2)] hover:shadow-[0_0_30px_rgba(37,99,235,0.4)]"
          >
            <Plus size={16} />
            Add Department
          </button>
        </div>

        {/* Search Bar */}
        <div className="mb-8 bg-gray-50 dark:bg-white/[0.02] p-4 rounded-2xl border border-gray-100 dark:border-white/5">
          <div className="relative group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-blue-500 transition-colors" size={16} />
            <input
              type="text"
              placeholder="Search departments by name, code, or description..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-12 pr-4 py-3 bg-white dark:bg-[#0a0a0a] border border-gray-200 dark:border-white/10 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all font-medium text-gray-900 dark:text-white"
            />
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-6 bg-red-50 dark:bg-red-900/10 border border-red-100 dark:border-red-900/20 rounded-xl p-4 animate-in slide-in-from-top-2 duration-300">
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400" />
                <p className="text-sm font-bold text-red-600 dark:text-red-400 uppercase tracking-tight">{error}</p>
              </div>
              <button
                onClick={fetchDepartments}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-xs font-black uppercase tracking-widest"
              >
                Retry
              </button>
            </div>
          </div>
        )}

        {/* Departments Grid */}
        {filteredDepartments.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredDepartments.map((department) => (
              <div
                key={department.id}
                className="glass-card rounded-3xl overflow-hidden group hover:scale-[1.02] transition-all duration-300 cursor-default"
              >
                <div className="p-8">
                  <div className="flex justify-between items-start mb-6">
                    <div>
                      <h3 className="text-xl font-black text-gray-900 dark:text-white uppercase tracking-tighter italic group-hover:text-blue-600 transition-colors">
                        {department.name}
                      </h3>
                      {department.code && (
                        <p className="text-[10px] font-mono text-gray-400 uppercase tracking-widest mt-1">{department.code}</p>
                      )}
                    </div>
                    <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => handleEditDepartment(department)}
                        className="p-2 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-500/10 rounded-xl transition-all"
                      >
                        <Edit2 size={16} />
                      </button>
                      <button
                        onClick={() => handleDeleteClick(department.id)}
                        className="p-2 text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-500/10 rounded-xl transition-all"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>

                  {department.description && (
                    <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-6 line-clamp-2">
                      {department.description}
                    </p>
                  )}

                  {department.head && (
                    <div className="mb-6 p-4 bg-blue-50/50 dark:bg-blue-500/5 border border-blue-100 dark:border-blue-500/10 rounded-2xl relative overflow-hidden">
                      <div className="relative z-10">
                        <p className="text-[10px] text-blue-600 dark:text-blue-400 font-black uppercase tracking-[0.2em] mb-2 flex items-center gap-2">
                          <ShieldCheck size={10} />
                          Department Head
                        </p>
                        <p className="text-sm font-bold text-gray-900 dark:text-white uppercase tracking-tight">{department.head.fullName}</p>
                        <p className="text-[10px] font-mono text-gray-500 dark:text-gray-400 italic mt-0.5">{department.head.email}</p>
                      </div>
                      <div className="absolute top-0 right-0 p-2 opacity-5 pointer-events-none">
                        <ShieldCheck size={40} />
                      </div>
                    </div>
                  )}

                  <div className="flex items-center gap-6 mb-6">
                    <div className="flex items-center gap-2">
                      <div className="p-1.5 bg-gray-100 dark:bg-white/5 rounded-lg">
                        <Users size={12} className="text-gray-500" />
                      </div>
                      <span className="text-[10px] font-black text-gray-500 dark:text-gray-400 uppercase tracking-widest">{department._count?.users || 0} nodes</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="p-1.5 bg-gray-100 dark:bg-white/5 rounded-lg">
                        <ShieldCheck size={12} className="text-gray-500" />
                      </div>
                      <span className="text-[10px] font-black text-gray-500 dark:text-gray-400 uppercase tracking-widest">{department._count?.teams || 0} units</span>
                    </div>
                  </div>

                  <div className="pt-6 border-t border-gray-100 dark:border-white/5">
                    <Link
                      href={`/admin/departments/${department.id}`}
                      className="text-[10px] font-black text-blue-600 dark:text-blue-400 hover:text-blue-500 uppercase tracking-[0.2em] flex items-center gap-2 transition-all"
                    >
                      Interface Access
                      <ArrowRight size={12} />
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-white dark:bg-[#0a0a0a] rounded-3xl shadow-sm p-20 text-center border border-gray-100 dark:border-white/5 border-dashed">
            <div className="text-6xl mb-6 grayscale opacity-20 group-hover:grayscale-0 group-hover:opacity-100 transition-all duration-700">🏢</div>
            <h3 className="text-xl font-black text-gray-900 dark:text-white uppercase tracking-widest mb-2">
              {searchTerm ? "No Matching Nodes" : "No Departments Detected"}
            </h3>
            <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-8 max-w-md mx-auto">
              {searchTerm 
                ? "Adjustment of search parameters required for node identification."
                : "Initialize your first departmental structure to begin organizational mapping."
              }
            </p>
            {!searchTerm && (
              <button
                onClick={handleCreateDepartment}
                className="px-8 py-4 bg-blue-600 text-white rounded-2xl hover:bg-blue-700 transition-all inline-flex items-center gap-3 text-xs font-black uppercase tracking-widest shadow-[0_0_20px_rgba(37,99,235,0.2)]"
              >
                <Plus size={20} />
                Create First Node
              </button>
            )}
          </div>
        )}
      </div>

      {/* Department Modal */}
      {showModal && (
        <DepartmentModal
          department={selectedDepartment}
          onClose={() => setShowModal(false)}
          onSuccess={() => {
            fetchDepartments();
            setShowModal(false);
          }}
        />
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <DeleteConfirmationModal
          title="Decommission Node"
          message="Are you sure you want to decommission this department? This action is irreversible and will decouple all associated users and teams."
          onConfirm={handleDeleteConfirm}
          onCancel={() => {
            setShowDeleteModal(false);
            setDepartmentToDelete(null);
          }}
        />
      )}
    </div>
  );
}
