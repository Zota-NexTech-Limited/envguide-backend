import React, { useState, useEffect, useCallback } from "react";
import {
  Shield,
  Users,
  Search,
  Save,
  RefreshCw,
  ChevronDown,
  ChevronRight,
  User,
  Building2,
  Plus,
  Edit,
  Trash2,
  X,
  UserCog,
} from "lucide-react";
import { Tabs, Select, message, Checkbox, Modal, Input, Form } from "antd";
import type { BackendUser } from "../../types";
import type { ModulePermission, MainModulePermission } from "../../types/userManagement";
import LoadingSpinner from "../../components/LoadingSpinner";
import authorizationService, { DEFAULT_MODULES } from "../../lib/authorizationService";
import { getApiBaseUrl } from "../../lib/apiBaseUrl";

const { Option } = Select;

interface Role {
  role_id: string;
  role_name: string;
  description?: string;
  role_code?: string;
}

interface ModuleWithPermissions {
  module_id: string;
  module_name: string;
  description?: string;
  create: boolean;
  read: boolean;
  update: boolean;
  delete: boolean;
  subModules?: ModuleWithPermissions[];
  expanded?: boolean;
}

type TabKey = "roles" | "by-user";

const AuthorizationsPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabKey>("by-user");
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  // Roles
  const [roles, setRoles] = useState<Role[]>([]);
  const [selectedRole, setSelectedRole] = useState<string>("");
  const [rolesLoading, setRolesLoading] = useState(false);
  const [roleSearch, setRoleSearch] = useState("");

  // Role Modal
  const [roleModalVisible, setRoleModalVisible] = useState(false);
  const [roleModalMode, setRoleModalMode] = useState<"create" | "edit">("create");
  const [editingRole, setEditingRole] = useState<Role | null>(null);
  const [roleForm] = Form.useForm();

  // Users
  const [users, setUsers] = useState<BackendUser[]>([]);
  const [selectedUser, setSelectedUser] = useState<string>("");
  const [usersLoading, setUsersLoading] = useState(false);
  const [selectedRoleFilter, setSelectedRoleFilter] = useState<string>("");

  // Modules & Permissions
  const [modules, setModules] = useState<ModuleWithPermissions[]>([]);
  const [originalPermissions, setOriginalPermissions] = useState<ModulePermission[]>([]);
  const [hasChanges, setHasChanges] = useState(false);

  // User-specific hierarchical permissions
  const [userPermissions, setUserPermissions] = useState<MainModulePermission[]>([]);
  const [expandedMainModules, setExpandedMainModules] = useState<Set<string>>(new Set());
  const [expandedModules, setExpandedModules] = useState<Set<string>>(new Set());

  // Load roles
  const loadRoles = useCallback(async () => {
    try {
      setRolesLoading(true);
      const result = await authorizationService.getRoles(roleSearch);

      if (result.success) {
        setRoles(result.data);
      } else {
        // Fallback to old API
        const response = await fetch(`${getApiBaseUrl()}/api/roles/get`);
        const data = await response.json();
        if (data.status && data.data) {
          const rolesList = Array.isArray(data.data) ? data.data : data.data.rows || [];
          setRoles(rolesList);
        }
      }
    } catch (error) {
      console.error("Error loading roles:", error);
      message.error("Failed to load roles");
    } finally {
      setRolesLoading(false);
    }
  }, [roleSearch]);

  // Load all users
  const loadUsers = useCallback(async () => {
    try {
      setUsersLoading(true);
      const response = await fetch(
        `${getApiBaseUrl()}/api/user/getAll?pageNumber=1&pageSize=100`
      );
      const data = await response.json();

      if (data.status && data.data && data.data.userList) {
        setUsers(data.data.userList);
      } else if (Array.isArray(data.data)) {
        setUsers(data.data);
      }
    } catch (error) {
      console.error("Error loading users:", error);
      message.error("Failed to load users");
    } finally {
      setUsersLoading(false);
    }
  }, []);

  // Load users by role using the new API
  const loadUsersByRole = useCallback(async (roleName: string) => {
    try {
      setUsersLoading(true);
      const response = await fetch(
        `${getApiBaseUrl()}/api/users/by-role?user_role=${encodeURIComponent(roleName)}`
      );
      const data = await response.json();

      if (data.status && Array.isArray(data.data)) {
        // Map the response to match our BackendUser structure
        const mappedUsers: BackendUser[] = data.data.map((u: { user_id: string; user_name: string; user_role: string }) => ({
          user_id: u.user_id,
          user_name: u.user_name,
          user_role: u.user_role,
          user_email: "", // Not returned by this API
        }));
        setUsers(mappedUsers);
      } else {
        setUsers([]);
      }
    } catch (error) {
      console.error("Error loading users by role:", error);
      message.error("Failed to load users by role");
      setUsers([]);
    } finally {
      setUsersLoading(false);
    }
  }, []);

  // Initialize modules
  const initializeModules = useCallback(() => {
    const defaultModulesWithPermissions: ModuleWithPermissions[] = DEFAULT_MODULES.map(
      (mod, idx) => ({
        module_id: `default-${idx}`,
        module_name: mod.name,
        description: mod.description,
        create: false,
        read: false,
        update: false,
        delete: false,
        expanded: false,
        subModules: mod.subModules?.map((sub, subIdx) => ({
          module_id: `default-${idx}-${subIdx}`,
          module_name: sub,
          description: `${sub} under ${mod.name}`,
          create: false,
          read: false,
          update: false,
          delete: false,
        })),
      })
    );
    setModules(defaultModulesWithPermissions);
  }, []);

  // Load permissions for user (hierarchical structure)
  const loadUserPermissions = useCallback(async (userId: string) => {
    try {
      setLoading(true);
      const result = await authorizationService.getPermissionsByUserId(userId);

      if (result.success) {
        // Debug: Log the raw API response to check permission_id presence
        console.log("[Permissions] Raw API response:", JSON.stringify(result.data, null, 2));

        // Store hierarchical permissions directly from API
        setUserPermissions(result.data as unknown as MainModulePermission[]);
        setOriginalPermissions(result.data);

        // Also update the old modules structure for backwards compatibility
        setModules((prevModules) =>
          prevModules.map((mod) => {
            const permission = result.data.find(
              (p) => p.module_name?.toLowerCase() === mod.module_name.toLowerCase()
            );

            return {
              ...mod,
              create: permission?.create || false,
              read: permission?.read || false,
              update: permission?.update || false,
              delete: permission?.delete || false,
              subModules: mod.subModules?.map((sub) => {
                const subPermission = result.data.find(
                  (p) => p.module_name?.toLowerCase() === sub.module_name.toLowerCase()
                );
                return {
                  ...sub,
                  create: subPermission?.create || false,
                  read: subPermission?.read || false,
                  update: subPermission?.update || false,
                  delete: subPermission?.delete || false,
                };
              }),
            };
          })
        );
      }
    } catch (error) {
      console.error("Error loading user permissions:", error);
      message.error("Failed to load user permissions");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadRoles();
    loadUsers();
    initializeModules();
  }, [loadRoles, loadUsers, initializeModules]);

  useEffect(() => {
    if (activeTab === "by-user" && selectedUser) {
      loadUserPermissions(selectedUser);
    }
  }, [activeTab, selectedUser, loadUserPermissions]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await Promise.all([loadRoles(), loadUsers()]);
    initializeModules();
    if (selectedUser) {
      await loadUserPermissions(selectedUser);
    }
    setRefreshing(false);
  };

  // Role CRUD handlers
  const openRoleModal = (mode: "create" | "edit", role?: Role) => {
    setRoleModalMode(mode);
    if (mode === "edit" && role) {
      setEditingRole(role);
      roleForm.setFieldsValue({
        role_name: role.role_name,
        description: role.description || "",
        role_code: role.role_code || "",
      });
    } else {
      setEditingRole(null);
      roleForm.resetFields();
    }
    setRoleModalVisible(true);
  };

  const handleRoleSubmit = async () => {
    try {
      const values = await roleForm.validateFields();
      setSaving(true);

      if (roleModalMode === "create") {
        const result = await authorizationService.createRole({
          role_name: values.role_name,
          description: values.description,
          role_code: values.role_code,
        });

        if (result.success) {
          message.success("Role created successfully");
          setRoleModalVisible(false);
          loadRoles();
        } else {
          message.error(result.message);
        }
      } else if (editingRole) {
        const result = await authorizationService.updateRole([
          {
            role_id: editingRole.role_id,
            role_name: values.role_name,
            description: values.description,
            role_code: values.role_code,
          },
        ]);

        if (result.success) {
          message.success("Role updated successfully");
          setRoleModalVisible(false);
          loadRoles();
        } else {
          message.error(result.message);
        }
      }
    } catch (error) {
      console.error("Error submitting role:", error);
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteRole = async (roleId: string) => {
    Modal.confirm({
      title: "Delete Role",
      content: "Are you sure you want to delete this role? This action cannot be undone.",
      okText: "Delete",
      okType: "danger",
      cancelText: "Cancel",
      onOk: async () => {
        const result = await authorizationService.deleteRole(roleId);
        if (result.success) {
          message.success("Role deleted successfully");
          loadRoles();
        } else {
          message.error(result.message);
        }
      },
    });
  };

  const toggleModuleExpand = (moduleId: string) => {
    setModules((prevModules) =>
      prevModules.map((mod) =>
        mod.module_id === moduleId ? { ...mod, expanded: !mod.expanded } : mod
      )
    );
  };

  const handlePermissionChange = (
    moduleId: string,
    permission: "create" | "read" | "update" | "delete",
    value: boolean,
    isSubModule: boolean = false,
    parentId?: string
  ) => {
    setHasChanges(true);

    setModules((prevModules) =>
      prevModules.map((mod) => {
        if (isSubModule && parentId === mod.module_id) {
          return {
            ...mod,
            subModules: mod.subModules?.map((sub) =>
              sub.module_id === moduleId ? { ...sub, [permission]: value } : sub
            ),
          };
        } else if (!isSubModule && mod.module_id === moduleId) {
          return {
            ...mod,
            [permission]: value,
            subModules: mod.subModules?.map((sub) => ({
              ...sub,
              [permission]: value,
            })),
          };
        }
        return mod;
      })
    );
  };

  const handleSelectAll = (permission: "create" | "read" | "update" | "delete", value: boolean) => {
    setHasChanges(true);
    setModules((prevModules) =>
      prevModules.map((mod) => ({
        ...mod,
        [permission]: value,
        subModules: mod.subModules?.map((sub) => ({
          ...sub,
          [permission]: value,
        })),
      }))
    );
  };

  // Toggle main module expansion
  const toggleMainModuleExpand = (mainModuleId: string) => {
    setExpandedMainModules((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(mainModuleId)) {
        newSet.delete(mainModuleId);
      } else {
        newSet.add(mainModuleId);
      }
      return newSet;
    });
  };

  // Toggle module expansion (hierarchical) - using composite key: mainModuleId + modulePermissionId
  const toggleHierarchyModuleExpand = (compositeKey: string) => {
    setExpandedModules((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(compositeKey)) {
        newSet.delete(compositeKey);
      } else {
        newSet.add(compositeKey);
      }
      return newSet;
    });
  };

  // Expand all modules
  const expandAllModules = () => {
    const allMainModuleIds = new Set(userPermissions.map((m) => m.main_module_id));
    const allModuleKeys = new Set<string>();
    userPermissions.forEach((main) => {
      main.modules.forEach((_, modIndex) => {
        // Use same key format as rendering: mainModuleId-mod-index
        allModuleKeys.add(`${main.main_module_id}-mod-${modIndex}`);
      });
    });
    setExpandedMainModules(allMainModuleIds);
    setExpandedModules(allModuleKeys);
  };

  // Collapse all modules
  const collapseAllModules = () => {
    setExpandedMainModules(new Set());
    setExpandedModules(new Set());
  };

  // Handle permission change for hierarchical structure - CASCADE to children for all fields
  const handleHierarchicalPermissionChange = (
    permissionId: string,
    field: "create" | "read" | "update" | "delete" | "print" | "export" | "send" | "all",
    value: boolean,
    level: "main" | "module" | "submodule",
    mainModuleId?: string,
    modulePermissionId?: string
  ) => {
    setHasChanges(true);

    setUserPermissions((prevPermissions) =>
      prevPermissions.map((mainModule) => {
        // Main module level - cascade to all children
        if (level === "main" && mainModule.main_module_id === mainModuleId) {
          const updatedMain = { ...mainModule };

          if (field === "all") {
            // "All" checkbox - set all permissions including children
            updatedMain.create = value;
            updatedMain.read = value;
            updatedMain.update = value;
            updatedMain.delete = value;
            updatedMain.print = value;
            updatedMain.export = value;
            updatedMain.send = value;
            updatedMain.all = value;
            updatedMain.modules = mainModule.modules.map((mod) => ({
              ...mod,
              create: value,
              read: value,
              update: value,
              delete: value,
              print: value,
              export: value,
              send: value,
              all: value,
              submodules: mod.submodules.map((sub) => ({
                ...sub,
                create: value,
                read: value,
                update: value,
                delete: value,
                print: value,
                export: value,
                send: value,
                all: value,
              })),
            }));
          } else {
            // Individual field - cascade to all children
            updatedMain[field] = value;
            updatedMain.modules = mainModule.modules.map((mod) => ({
              ...mod,
              [field]: value,
              all: (
                (field === "create" ? value : mod.create) &&
                (field === "read" ? value : mod.read) &&
                (field === "update" ? value : mod.update) &&
                (field === "delete" ? value : mod.delete) &&
                (field === "print" ? value : mod.print) &&
                (field === "export" ? value : mod.export) &&
                (field === "send" ? value : mod.send)
              ),
              submodules: mod.submodules.map((sub) => ({
                ...sub,
                [field]: value,
                all: (
                  (field === "create" ? value : sub.create) &&
                  (field === "read" ? value : sub.read) &&
                  (field === "update" ? value : sub.update) &&
                  (field === "delete" ? value : sub.delete) &&
                  (field === "print" ? value : sub.print) &&
                  (field === "export" ? value : sub.export) &&
                  (field === "send" ? value : sub.send)
                ),
              })),
            }));
            // Check if all individual permissions are true to set "all"
            updatedMain.all = updatedMain.create && updatedMain.read && updatedMain.update && updatedMain.delete && updatedMain.print && updatedMain.export && updatedMain.send;
          }
          return updatedMain;
        }

        // Module level (under a main module) - cascade to submodules
        if (level === "module" && mainModule.main_module_id === mainModuleId) {
          return {
            ...mainModule,
            modules: mainModule.modules.map((mod) => {
              if (mod.permission_id === permissionId) {
                const updatedMod = { ...mod };

                if (field === "all") {
                  // "All" checkbox - set all permissions including children
                  updatedMod.create = value;
                  updatedMod.read = value;
                  updatedMod.update = value;
                  updatedMod.delete = value;
                  updatedMod.print = value;
                  updatedMod.export = value;
                  updatedMod.send = value;
                  updatedMod.all = value;
                  updatedMod.submodules = mod.submodules.map((sub) => ({
                    ...sub,
                    create: value,
                    read: value,
                    update: value,
                    delete: value,
                    print: value,
                    export: value,
                    send: value,
                    all: value,
                  }));
                } else {
                  // Individual field - cascade to submodules
                  updatedMod[field] = value;
                  updatedMod.submodules = mod.submodules.map((sub) => ({
                    ...sub,
                    [field]: value,
                    all: (
                      (field === "create" ? value : sub.create) &&
                      (field === "read" ? value : sub.read) &&
                      (field === "update" ? value : sub.update) &&
                      (field === "delete" ? value : sub.delete) &&
                      (field === "print" ? value : sub.print) &&
                      (field === "export" ? value : sub.export) &&
                      (field === "send" ? value : sub.send)
                    ),
                  }));
                  updatedMod.all = updatedMod.create && updatedMod.read && updatedMod.update && updatedMod.delete && updatedMod.print && updatedMod.export && updatedMod.send;
                }
                return updatedMod;
              }
              return mod;
            }),
          };
        }

        // Submodule level - no children to cascade to
        if (level === "submodule" && mainModule.main_module_id === mainModuleId) {
          return {
            ...mainModule,
            modules: mainModule.modules.map((mod) => {
              if (mod.permission_id === modulePermissionId) {
                return {
                  ...mod,
                  submodules: mod.submodules.map((sub) => {
                    if (sub.permission_id === permissionId) {
                      const updatedSub = { ...sub };

                      if (field === "all") {
                        updatedSub.create = value;
                        updatedSub.read = value;
                        updatedSub.update = value;
                        updatedSub.delete = value;
                        updatedSub.print = value;
                        updatedSub.export = value;
                        updatedSub.send = value;
                        updatedSub.all = value;
                      } else {
                        updatedSub[field] = value;
                        updatedSub.all = updatedSub.create && updatedSub.read && updatedSub.update && updatedSub.delete && updatedSub.print && updatedSub.export && updatedSub.send;
                      }
                      return updatedSub;
                    }
                    return sub;
                  }),
                };
              }
              return mod;
            }),
          };
        }

        return mainModule;
      })
    );
  };

  // Save hierarchical permissions
  const handleSaveHierarchicalPermissions = async () => {
    if (!selectedUser) {
      message.warning("Please select a user first");
      return;
    }

    try {
      setSaving(true);

      // Flatten all permissions into array for update API
      const permissionsToUpdate: any[] = [];

      userPermissions.forEach((mainModule) => {
        // Add main module permission - only if permission_id exists
        if (mainModule.permission_id) {
          permissionsToUpdate.push({
            permission_id: mainModule.permission_id,
            user_id: mainModule.user_id || selectedUser,
            module_name: mainModule.main_module_name,
            create: mainModule.create,
            update: mainModule.update,
            delete: mainModule.delete,
            read: mainModule.read,
            print: mainModule.print,
            export: mainModule.export,
            send: mainModule.send,
            all: mainModule.all,
          });
        }

        // Add module permissions
        mainModule.modules.forEach((mod) => {
          if (mod.permission_id) {
            permissionsToUpdate.push({
              permission_id: mod.permission_id,
              user_id: mod.user_id || selectedUser,
              module_name: mod.module_name,
              create: mod.create,
              update: mod.update,
              delete: mod.delete,
              read: mod.read,
              print: mod.print,
              export: mod.export,
              send: mod.send,
              all: mod.all,
            });
          }

          // Add submodule permissions
          mod.submodules.forEach((sub) => {
            if (sub.permission_id) {
              permissionsToUpdate.push({
                permission_id: sub.permission_id,
                user_id: sub.user_id || selectedUser,
                module_name: sub.submodule_name,
                create: sub.create,
                update: sub.update,
                delete: sub.delete,
                read: sub.read,
                print: sub.print,
                export: sub.export,
                send: sub.send,
                all: sub.all,
              });
            }
          });
        });
      });

      console.log("[Permissions] Updating permissions:", permissionsToUpdate);

      const result = await authorizationService.updatePermissions(permissionsToUpdate);

      if (result.success) {
        message.success("Permissions saved successfully");
        setHasChanges(false);
        // Reload permissions
        await loadUserPermissions(selectedUser);
      } else {
        message.error(result.message || "Failed to save permissions");
      }
    } catch (error) {
      console.error("Error saving permissions:", error);
      message.error("Failed to save permissions");
    } finally {
      setSaving(false);
    }
  };

  const handleSavePermissions = async () => {
    if (!selectedUser && activeTab === "by-user") {
      message.warning("Please select a user first");
      return;
    }

    try {
      setSaving(true);

      const permissionsToSave: Omit<ModulePermission, "permission_id">[] = [];

      modules.forEach((mod) => {
        permissionsToSave.push({
          user_id: selectedUser,
          module_name: mod.module_name,
          create: mod.create,
          read: mod.read,
          update: mod.update,
          delete: mod.delete,
        });

        mod.subModules?.forEach((sub) => {
          permissionsToSave.push({
            user_id: selectedUser,
            module_name: sub.module_name,
            create: sub.create,
            read: sub.read,
            update: sub.update,
            delete: sub.delete,
          });
        });
      });

      for (const perm of permissionsToSave) {
        const existing = originalPermissions.find(
          (p) => p.module_name.toLowerCase() === perm.module_name.toLowerCase()
        );

        if (existing && existing.permission_id) {
          await authorizationService.updatePermissions([
            {
              ...perm,
              permission_id: existing.permission_id,
            },
          ]);
        } else {
          await authorizationService.addPermission(perm);
        }
      }

      message.success("Permissions saved successfully");
      setHasChanges(false);

      if (selectedUser) {
        await loadUserPermissions(selectedUser);
      }
    } catch (error) {
      console.error("Error saving permissions:", error);
      message.error("Failed to save permissions");
    } finally {
      setSaving(false);
    }
  };

  const filteredRoles = roles.filter(
    (role) =>
      role.role_name?.toLowerCase().includes(roleSearch.toLowerCase()) ||
      role.description?.toLowerCase().includes(roleSearch.toLowerCase())
  );

  const renderPermissionMatrix = () => {
    if (loading) {
      return (
        <div className="flex items-center justify-center py-12">
          <LoadingSpinner size="lg" />
        </div>
      );
    }

    return (
      <div className="overflow-x-auto">
        <table className="min-w-full">
          <thead className="bg-gray-50 sticky top-0">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-1/3">
                Module
              </th>
              <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider w-1/6">
                <div className="flex flex-col items-center gap-1">
                  <span>Create</span>
                  <Checkbox
                    checked={modules.every((m) => m.create)}
                    indeterminate={modules.some((m) => m.create) && !modules.every((m) => m.create)}
                    onChange={(e) => handleSelectAll("create", e.target.checked)}
                  />
                </div>
              </th>
              <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider w-1/6">
                <div className="flex flex-col items-center gap-1">
                  <span>Read</span>
                  <Checkbox
                    checked={modules.every((m) => m.read)}
                    indeterminate={modules.some((m) => m.read) && !modules.every((m) => m.read)}
                    onChange={(e) => handleSelectAll("read", e.target.checked)}
                  />
                </div>
              </th>
              <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider w-1/6">
                <div className="flex flex-col items-center gap-1">
                  <span>Update</span>
                  <Checkbox
                    checked={modules.every((m) => m.update)}
                    indeterminate={modules.some((m) => m.update) && !modules.every((m) => m.update)}
                    onChange={(e) => handleSelectAll("update", e.target.checked)}
                  />
                </div>
              </th>
              <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider w-1/6">
                <div className="flex flex-col items-center gap-1">
                  <span>Delete</span>
                  <Checkbox
                    checked={modules.every((m) => m.delete)}
                    indeterminate={modules.some((m) => m.delete) && !modules.every((m) => m.delete)}
                    onChange={(e) => handleSelectAll("delete", e.target.checked)}
                  />
                </div>
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {modules.map((module) => (
              <>
                <tr key={module.module_id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-2">
                      {module.subModules && module.subModules.length > 0 && (
                        <button
                          onClick={() => toggleModuleExpand(module.module_id)}
                          className="p-1 hover:bg-gray-200 rounded"
                        >
                          {module.expanded ? (
                            <ChevronDown className="h-4 w-4 text-gray-500" />
                          ) : (
                            <ChevronRight className="h-4 w-4 text-gray-500" />
                          )}
                        </button>
                      )}
                      {(!module.subModules || module.subModules.length === 0) && (
                        <div className="w-6" />
                      )}
                      <div>
                        <div className="text-sm font-medium text-gray-900">{module.module_name}</div>
                        {module.description && (
                          <div className="text-xs text-gray-500">{module.description}</div>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-4 text-center">
                    <Checkbox
                      checked={module.create}
                      onChange={(e) =>
                        handlePermissionChange(module.module_id, "create", e.target.checked)
                      }
                    />
                  </td>
                  <td className="px-4 py-4 text-center">
                    <Checkbox
                      checked={module.read}
                      onChange={(e) =>
                        handlePermissionChange(module.module_id, "read", e.target.checked)
                      }
                    />
                  </td>
                  <td className="px-4 py-4 text-center">
                    <Checkbox
                      checked={module.update}
                      onChange={(e) =>
                        handlePermissionChange(module.module_id, "update", e.target.checked)
                      }
                    />
                  </td>
                  <td className="px-4 py-4 text-center">
                    <Checkbox
                      checked={module.delete}
                      onChange={(e) =>
                        handlePermissionChange(module.module_id, "delete", e.target.checked)
                      }
                    />
                  </td>
                </tr>
                {module.expanded &&
                  module.subModules?.map((sub) => (
                    <tr key={sub.module_id} className="hover:bg-gray-50 bg-gray-25">
                      <td className="px-6 py-3 whitespace-nowrap">
                        <div className="flex items-center gap-2 pl-10">
                          <div className="w-2 h-2 bg-gray-300 rounded-full" />
                          <div>
                            <div className="text-sm text-gray-700">{sub.module_name}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <Checkbox
                          checked={sub.create}
                          onChange={(e) =>
                            handlePermissionChange(
                              sub.module_id,
                              "create",
                              e.target.checked,
                              true,
                              module.module_id
                            )
                          }
                        />
                      </td>
                      <td className="px-4 py-3 text-center">
                        <Checkbox
                          checked={sub.read}
                          onChange={(e) =>
                            handlePermissionChange(
                              sub.module_id,
                              "read",
                              e.target.checked,
                              true,
                              module.module_id
                            )
                          }
                        />
                      </td>
                      <td className="px-4 py-3 text-center">
                        <Checkbox
                          checked={sub.update}
                          onChange={(e) =>
                            handlePermissionChange(
                              sub.module_id,
                              "update",
                              e.target.checked,
                              true,
                              module.module_id
                            )
                          }
                        />
                      </td>
                      <td className="px-4 py-3 text-center">
                        <Checkbox
                          checked={sub.delete}
                          onChange={(e) =>
                            handlePermissionChange(
                              sub.module_id,
                              "delete",
                              e.target.checked,
                              true,
                              module.module_id
                            )
                          }
                        />
                      </td>
                    </tr>
                  ))}
              </>
            ))}
          </tbody>
        </table>
      </div>
    );
  };

  // Roles Tab
  const renderRolesTab = () => {
    return (
      <div className="space-y-4">
        <div className="bg-white rounded-xl border border-gray-100 p-4">
          <div className="flex items-center justify-between gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search roles..."
                className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-500 transition-colors"
                value={roleSearch}
                onChange={(e) => setRoleSearch(e.target.value)}
              />
            </div>
            <button
              onClick={() => openRoleModal("create")}
              className="flex items-center gap-2 px-4 py-2.5 bg-green-600 text-white rounded-xl hover:bg-green-700 transition-colors"
            >
              <Plus className="h-4 w-4" />
              <span>Add Role</span>
            </button>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
          <div className="overflow-x-auto">
            {rolesLoading ? (
              <div className="flex items-center justify-center py-12">
                <LoadingSpinner size="lg" />
              </div>
            ) : filteredRoles.length > 0 ? (
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Role Name
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Code
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Description
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredRoles.map((role) => (
                    <tr key={role.role_id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg bg-green-100 flex items-center justify-center">
                            <UserCog className="h-4 w-4 text-green-600" />
                          </div>
                          <span className="text-sm font-medium text-gray-900">{role.role_name}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-sm text-gray-500">{role.role_code || "-"}</span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-sm text-gray-500">{role.description || "-"}</span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => openRoleModal("edit", role)}
                            className="p-2 text-gray-500 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                          >
                            <Edit className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteRole(role.role_id)}
                            className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <div className="p-12 text-center">
                <UserCog className="h-12 w-12 mx-auto text-gray-300 mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No Roles Found</h3>
                <p className="text-gray-500">
                  {roleSearch ? "No roles match your search." : "Create your first role to get started."}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  const renderByRoleTab = () => {
    return (
      <div className="space-y-4">
        <div className="bg-white rounded-xl border border-gray-100 p-4">
          <div className="flex items-center gap-4">
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-2">Select Role</label>
              <Select
                placeholder="Select a role to configure permissions"
                className="w-full"
                size="large"
                loading={rolesLoading}
                value={selectedRole || undefined}
                onChange={(value) => setSelectedRole(value)}
              >
                {roles.map((role) => (
                  <Option key={role.role_id} value={role.role_id}>
                    {role.role_name}
                  </Option>
                ))}
              </Select>
            </div>
          </div>
        </div>

        {selectedRole ? (
          <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Module Permissions</h3>
                <p className="text-sm text-gray-500">
                  Configure CRUD permissions for each module for this role
                </p>
              </div>
              {hasChanges && (
                <span className="text-sm text-amber-600 bg-amber-50 px-3 py-1 rounded-full">
                  Unsaved changes
                </span>
              )}
            </div>
            {renderPermissionMatrix()}
          </div>
        ) : (
          <div className="bg-white rounded-xl border border-gray-100 p-12 text-center">
            <Shield className="h-12 w-12 mx-auto text-gray-300 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Select a Role</h3>
            <p className="text-gray-500">
              Choose a role from the dropdown above to configure its module permissions
            </p>
          </div>
        )}
      </div>
    );
  };

  // Render hierarchical permission matrix with improved UI
  const renderHierarchicalPermissionMatrix = () => {
    if (loading) {
      return (
        <div className="flex items-center justify-center py-12">
          <LoadingSpinner size="lg" />
        </div>
      );
    }

    if (userPermissions.length === 0) {
      return (
        <div className="p-12 text-center">
          <Shield className="h-12 w-12 mx-auto text-gray-300 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No Permissions Found</h3>
          <p className="text-gray-500">No permissions have been configured for this user yet.</p>
        </div>
      );
    }

    return (
      <div className="overflow-x-auto">
        <table className="min-w-full">
          <thead className="bg-gray-50 sticky top-0 z-10">
            <tr>
              <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider min-w-[250px]">
                Module
              </th>
              <th className="px-3 py-4 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider">
                Create
              </th>
              <th className="px-3 py-4 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider">
                Read
              </th>
              <th className="px-3 py-4 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider">
                Update
              </th>
              <th className="px-3 py-4 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider">
                Delete
              </th>
              <th className="px-3 py-4 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider">
                Print
              </th>
              <th className="px-3 py-4 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider">
                Export
              </th>
              <th className="px-3 py-4 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider">
                Send
              </th>
              <th className="px-3 py-4 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider">
                <span className="text-green-600">All</span>
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {userPermissions.map((mainModule) => {
              const isMainExpanded = expandedMainModules.has(mainModule.main_module_id);
              const hasModules = mainModule.modules.length > 0;

              return (
                <React.Fragment key={`main-${mainModule.main_module_id}`}>
                  {/* Main Module Row */}
                  <tr className="bg-gradient-to-r from-green-50 to-emerald-50 hover:from-green-100 hover:to-emerald-100 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        {hasModules ? (
                          <button
                            onClick={() => toggleMainModuleExpand(mainModule.main_module_id)}
                            className="p-1.5 hover:bg-green-200 rounded-lg transition-colors"
                          >
                            {isMainExpanded ? (
                              <ChevronDown className="h-4 w-4 text-green-600" />
                            ) : (
                              <ChevronRight className="h-4 w-4 text-green-600" />
                            )}
                          </button>
                        ) : (
                          <div className="w-7" />
                        )}
                        <div className="w-8 h-8 rounded-lg bg-green-500 flex items-center justify-center">
                          <Shield className="h-4 w-4 text-white" />
                        </div>
                        <span className="text-sm font-semibold text-gray-900">
                          {mainModule.main_module_name}
                        </span>
                        {hasModules && (
                          <span className="text-xs text-green-600 bg-green-100 px-2 py-0.5 rounded-full">
                            {mainModule.modules.length} modules
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-3 py-4 text-center">
                      <Checkbox
                        checked={mainModule.create}
                        onChange={(e) =>
                          handleHierarchicalPermissionChange(
                            mainModule.permission_id,
                            "create",
                            e.target.checked,
                            "main",
                            mainModule.main_module_id
                          )
                        }
                      />
                    </td>
                    <td className="px-3 py-4 text-center">
                      <Checkbox
                        checked={mainModule.read}
                        onChange={(e) =>
                          handleHierarchicalPermissionChange(
                            mainModule.permission_id,
                            "read",
                            e.target.checked,
                            "main",
                            mainModule.main_module_id
                          )
                        }
                      />
                    </td>
                    <td className="px-3 py-4 text-center">
                      <Checkbox
                        checked={mainModule.update}
                        onChange={(e) =>
                          handleHierarchicalPermissionChange(
                            mainModule.permission_id,
                            "update",
                            e.target.checked,
                            "main",
                            mainModule.main_module_id
                          )
                        }
                      />
                    </td>
                    <td className="px-3 py-4 text-center">
                      <Checkbox
                        checked={mainModule.delete}
                        onChange={(e) =>
                          handleHierarchicalPermissionChange(
                            mainModule.permission_id,
                            "delete",
                            e.target.checked,
                            "main",
                            mainModule.main_module_id
                          )
                        }
                      />
                    </td>
                    <td className="px-3 py-4 text-center">
                      <Checkbox
                        checked={mainModule.print}
                        onChange={(e) =>
                          handleHierarchicalPermissionChange(
                            mainModule.permission_id,
                            "print",
                            e.target.checked,
                            "main",
                            mainModule.main_module_id
                          )
                        }
                      />
                    </td>
                    <td className="px-3 py-4 text-center">
                      <Checkbox
                        checked={mainModule.export}
                        onChange={(e) =>
                          handleHierarchicalPermissionChange(
                            mainModule.permission_id,
                            "export",
                            e.target.checked,
                            "main",
                            mainModule.main_module_id
                          )
                        }
                      />
                    </td>
                    <td className="px-3 py-4 text-center">
                      <Checkbox
                        checked={mainModule.send}
                        onChange={(e) =>
                          handleHierarchicalPermissionChange(
                            mainModule.permission_id,
                            "send",
                            e.target.checked,
                            "main",
                            mainModule.main_module_id
                          )
                        }
                      />
                    </td>
                    <td className="px-3 py-4 text-center">
                      <Checkbox
                        checked={mainModule.all}
                        onChange={(e) =>
                          handleHierarchicalPermissionChange(
                            mainModule.permission_id,
                            "all",
                            e.target.checked,
                            "main",
                            mainModule.main_module_id
                          )
                        }
                        className="[&_.ant-checkbox-checked_.ant-checkbox-inner]:bg-green-600 [&_.ant-checkbox-checked_.ant-checkbox-inner]:border-green-600"
                      />
                    </td>
                  </tr>

                  {/* Module Rows */}
                  {isMainExpanded &&
                    mainModule.modules.map((mod, modIndex) => {
                      // Use module index for guaranteed uniqueness - permission_id might not be unique
                      const moduleCompositeKey = `${mainModule.main_module_id}-mod-${modIndex}`;
                      const isModuleExpanded = expandedModules.has(moduleCompositeKey);
                      const hasSubmodules = mod.submodules.length > 0;

                      return (
                        <React.Fragment key={`mod-${moduleCompositeKey}`}>
                          <tr className="bg-white hover:bg-gray-50 transition-colors">
                            <td className="px-6 py-3">
                              <div className="flex items-center gap-3 pl-10">
                                {hasSubmodules ? (
                                  <button
                                    onClick={() => toggleHierarchyModuleExpand(moduleCompositeKey)}
                                    className="p-1.5 hover:bg-gray-200 rounded-lg transition-colors"
                                  >
                                    {isModuleExpanded ? (
                                      <ChevronDown className="h-4 w-4 text-gray-500" />
                                    ) : (
                                      <ChevronRight className="h-4 w-4 text-gray-500" />
                                    )}
                                  </button>
                                ) : (
                                  <div className="w-7" />
                                )}
                                <div className="w-6 h-6 rounded-md bg-blue-100 flex items-center justify-center">
                                  <div className="w-2 h-2 bg-blue-500 rounded-full" />
                                </div>
                                <span className="text-sm font-medium text-gray-700">
                                  {mod.module_name}
                                </span>
                                {hasSubmodules && (
                                  <span className="text-xs text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full">
                                    {mod.submodules.length}
                                  </span>
                                )}
                              </div>
                            </td>
                            <td className="px-3 py-3 text-center">
                              <Checkbox
                                checked={mod.create}
                                onChange={(e) =>
                                  handleHierarchicalPermissionChange(
                                    mod.permission_id,
                                    "create",
                                    e.target.checked,
                                    "module",
                                    mainModule.main_module_id
                                  )
                                }
                              />
                            </td>
                            <td className="px-3 py-3 text-center">
                              <Checkbox
                                checked={mod.read}
                                onChange={(e) =>
                                  handleHierarchicalPermissionChange(
                                    mod.permission_id,
                                    "read",
                                    e.target.checked,
                                    "module",
                                    mainModule.main_module_id
                                  )
                                }
                              />
                            </td>
                            <td className="px-3 py-3 text-center">
                              <Checkbox
                                checked={mod.update}
                                onChange={(e) =>
                                  handleHierarchicalPermissionChange(
                                    mod.permission_id,
                                    "update",
                                    e.target.checked,
                                    "module",
                                    mainModule.main_module_id
                                  )
                                }
                              />
                            </td>
                            <td className="px-3 py-3 text-center">
                              <Checkbox
                                checked={mod.delete}
                                onChange={(e) =>
                                  handleHierarchicalPermissionChange(
                                    mod.permission_id,
                                    "delete",
                                    e.target.checked,
                                    "module",
                                    mainModule.main_module_id
                                  )
                                }
                              />
                            </td>
                            <td className="px-3 py-3 text-center">
                              <Checkbox
                                checked={mod.print}
                                onChange={(e) =>
                                  handleHierarchicalPermissionChange(
                                    mod.permission_id,
                                    "print",
                                    e.target.checked,
                                    "module",
                                    mainModule.main_module_id
                                  )
                                }
                              />
                            </td>
                            <td className="px-3 py-3 text-center">
                              <Checkbox
                                checked={mod.export}
                                onChange={(e) =>
                                  handleHierarchicalPermissionChange(
                                    mod.permission_id,
                                    "export",
                                    e.target.checked,
                                    "module",
                                    mainModule.main_module_id
                                  )
                                }
                              />
                            </td>
                            <td className="px-3 py-3 text-center">
                              <Checkbox
                                checked={mod.send}
                                onChange={(e) =>
                                  handleHierarchicalPermissionChange(
                                    mod.permission_id,
                                    "send",
                                    e.target.checked,
                                    "module",
                                    mainModule.main_module_id
                                  )
                                }
                              />
                            </td>
                            <td className="px-3 py-3 text-center">
                              <Checkbox
                                checked={mod.all}
                                onChange={(e) =>
                                  handleHierarchicalPermissionChange(
                                    mod.permission_id,
                                    "all",
                                    e.target.checked,
                                    "module",
                                    mainModule.main_module_id
                                  )
                                }
                              />
                            </td>
                          </tr>

                          {/* Submodule Rows */}
                          {isModuleExpanded &&
                            mod.submodules.map((sub) => (
                              <tr
                                key={`sub-${mainModule.main_module_id}-${mod.permission_id}-${sub.permission_id}`}
                                className="bg-gray-50/50 hover:bg-gray-100 transition-colors"
                              >
                                <td className="px-6 py-2.5">
                                  <div className="flex items-center gap-3 pl-20">
                                    <div className="w-1.5 h-1.5 bg-gray-400 rounded-full" />
                                    <span className="text-sm text-gray-600">
                                      {sub.submodule_name}
                                    </span>
                                  </div>
                                </td>
                                <td className="px-3 py-2.5 text-center">
                                  <Checkbox
                                    checked={sub.create}
                                    onChange={(e) =>
                                      handleHierarchicalPermissionChange(
                                        sub.permission_id,
                                        "create",
                                        e.target.checked,
                                        "submodule",
                                        mainModule.main_module_id,
                                        mod.permission_id
                                      )
                                    }
                                  />
                                </td>
                                <td className="px-3 py-2.5 text-center">
                                  <Checkbox
                                    checked={sub.read}
                                    onChange={(e) =>
                                      handleHierarchicalPermissionChange(
                                        sub.permission_id,
                                        "read",
                                        e.target.checked,
                                        "submodule",
                                        mainModule.main_module_id,
                                        mod.permission_id
                                      )
                                    }
                                  />
                                </td>
                                <td className="px-3 py-2.5 text-center">
                                  <Checkbox
                                    checked={sub.update}
                                    onChange={(e) =>
                                      handleHierarchicalPermissionChange(
                                        sub.permission_id,
                                        "update",
                                        e.target.checked,
                                        "submodule",
                                        mainModule.main_module_id,
                                        mod.permission_id
                                      )
                                    }
                                  />
                                </td>
                                <td className="px-3 py-2.5 text-center">
                                  <Checkbox
                                    checked={sub.delete}
                                    onChange={(e) =>
                                      handleHierarchicalPermissionChange(
                                        sub.permission_id,
                                        "delete",
                                        e.target.checked,
                                        "submodule",
                                        mainModule.main_module_id,
                                        mod.permission_id
                                      )
                                    }
                                  />
                                </td>
                                <td className="px-3 py-2.5 text-center">
                                  <Checkbox
                                    checked={sub.print}
                                    onChange={(e) =>
                                      handleHierarchicalPermissionChange(
                                        sub.permission_id,
                                        "print",
                                        e.target.checked,
                                        "submodule",
                                        mainModule.main_module_id,
                                        mod.permission_id
                                      )
                                    }
                                  />
                                </td>
                                <td className="px-3 py-2.5 text-center">
                                  <Checkbox
                                    checked={sub.export}
                                    onChange={(e) =>
                                      handleHierarchicalPermissionChange(
                                        sub.permission_id,
                                        "export",
                                        e.target.checked,
                                        "submodule",
                                        mainModule.main_module_id,
                                        mod.permission_id
                                      )
                                    }
                                  />
                                </td>
                                <td className="px-3 py-2.5 text-center">
                                  <Checkbox
                                    checked={sub.send}
                                    onChange={(e) =>
                                      handleHierarchicalPermissionChange(
                                        sub.permission_id,
                                        "send",
                                        e.target.checked,
                                        "submodule",
                                        mainModule.main_module_id,
                                        mod.permission_id
                                      )
                                    }
                                  />
                                </td>
                                <td className="px-3 py-2.5 text-center">
                                  <Checkbox
                                    checked={sub.all}
                                    onChange={(e) =>
                                      handleHierarchicalPermissionChange(
                                        sub.permission_id,
                                        "all",
                                        e.target.checked,
                                        "submodule",
                                        mainModule.main_module_id,
                                        mod.permission_id
                                      )
                                    }
                                  />
                                </td>
                              </tr>
                            ))}
                        </React.Fragment>
                      );
                    })}
                </React.Fragment>
              );
            })}
          </tbody>
        </table>
      </div>
    );
  };

  const renderByUserTab = () => {
    const selectedUserData = users.find((u) => u.user_id === selectedUser);

    // Users are now fetched directly from API based on role filter, no client-side filtering needed
    const displayUsers = users;

    return (
      <div className="space-y-4">
        <div className="bg-white rounded-xl border border-gray-100 p-5">
          <div className="flex items-center gap-4">
            {/* Role Filter */}
            <div className="w-64">
              <label className="block text-sm font-medium text-gray-700 mb-2">Filter by Role</label>
              <Select
                allowClear
                placeholder="All Roles"
                className="w-full"
                size="large"
                loading={rolesLoading}
                value={selectedRoleFilter || undefined}
                onChange={async (value) => {
                  setSelectedRoleFilter(value || "");
                  // Clear selected user when role filter changes
                  setSelectedUser("");
                  setUserPermissions([]);
                  setExpandedMainModules(new Set());
                  setExpandedModules(new Set());

                  // Fetch users based on role selection
                  if (value) {
                    // Find the role name from the selected role_id
                    const selectedRoleData = roles.find((r) => r.role_id === value);
                    if (selectedRoleData) {
                      await loadUsersByRole(selectedRoleData.role_name);
                    }
                  } else {
                    // No role selected, load all users
                    await loadUsers();
                  }
                }}
              >
                {roles.map((role) => (
                  <Option key={role.role_id} value={role.role_id}>
                    <div className="flex items-center gap-2">
                      <UserCog className="h-4 w-4 text-gray-400" />
                      <span>{role.role_name}</span>
                    </div>
                  </Option>
                ))}
              </Select>
            </div>

            {/* User Select */}
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Select User {selectedRoleFilter && displayUsers.length > 0 && `(${displayUsers.length} users)`}
              </label>
              <Select
                showSearch
                placeholder={selectedRoleFilter ? "Select a user from this role" : "Search for a user by name or email"}
                className="w-full"
                size="large"
                loading={usersLoading}
                value={selectedUser || undefined}
                onChange={(value) => {
                  setSelectedUser(value);
                  setExpandedMainModules(new Set());
                  setExpandedModules(new Set());
                }}
                filterOption={(input, option) => {
                  const user = displayUsers.find((u) => u.user_id === option?.value);
                  return (
                    user?.user_name?.toLowerCase().includes(input.toLowerCase()) ||
                    user?.user_email?.toLowerCase().includes(input.toLowerCase()) ||
                    false
                  );
                }}
              >
                {displayUsers.map((user) => (
                  <Option key={user.user_id} value={user.user_id}>
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-full bg-gradient-to-br from-green-500 to-emerald-500 flex items-center justify-center text-xs font-medium text-white">
                        {user.user_name?.charAt(0)?.toUpperCase() || "U"}
                      </div>
                      <div>
                        <span className="font-medium">{user.user_name}</span>
                        {user.user_email ? (
                          <span className="text-gray-500 ml-2">({user.user_email})</span>
                        ) : user.user_role ? (
                          <span className="text-gray-400 ml-2">- {user.user_role}</span>
                        ) : null}
                      </div>
                    </div>
                  </Option>
                ))}
              </Select>
            </div>
          </div>
        </div>

        {selectedUser ? (
          <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100">
              <div className="flex items-center justify-between flex-wrap gap-4">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-green-500 to-emerald-500 flex items-center justify-center text-lg font-semibold text-white">
                    {selectedUserData?.user_name?.charAt(0)?.toUpperCase() || "U"}
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">
                      {selectedUserData?.user_name || "User"} Permissions
                    </h3>
                    <p className="text-sm text-gray-500">
                      {selectedUserData?.user_email || "Configure module permissions"}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  {hasChanges && (
                    <span className="text-sm text-amber-600 bg-amber-50 px-3 py-1.5 rounded-full font-medium">
                      Unsaved changes
                    </span>
                  )}
                  <button
                    onClick={expandAllModules}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-gray-600 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                  >
                    <ChevronDown className="h-4 w-4" />
                    Expand All
                  </button>
                  <button
                    onClick={collapseAllModules}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-gray-600 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                  >
                    <ChevronRight className="h-4 w-4" />
                    Collapse All
                  </button>
                </div>
              </div>
            </div>

            {/* Permission Legend */}
            <div className="px-6 py-3 bg-gray-50 border-b border-gray-100 flex items-center gap-4 text-xs text-gray-500 flex-wrap">
              <span className="font-medium">Permissions:</span>
              <span><strong>C</strong>reate</span>
              <span><strong>R</strong>ead</span>
              <span><strong>U</strong>pdate</span>
              <span><strong>D</strong>elete</span>
              <span><strong>P</strong>rint</span>
              <span><strong>E</strong>xport</span>
              <span><strong>S</strong>end</span>
              <span className="text-green-600"><strong>All</strong> - Grant all (cascades)</span>
            </div>

            {renderHierarchicalPermissionMatrix()}
          </div>
        ) : (
          <div className="bg-white rounded-xl border border-gray-100 p-12 text-center">
            <div className="w-16 h-16 mx-auto bg-green-100 rounded-2xl flex items-center justify-center mb-4">
              <User className="h-8 w-8 text-green-400" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Select a User</h3>
            <p className="text-gray-500 max-w-md mx-auto">
              Choose a user from the dropdown above to view and configure their individual module permissions
            </p>
          </div>
        )}
      </div>
    );
  };

  const tabItems = [
    {
      key: "by-user",
      label: (
        <span className="flex items-center gap-2">
          <User className="h-4 w-4" />
          User Permissions
        </span>
      ),
      children: renderByUserTab(),
    },
    {
      key: "roles",
      label: (
        <span className="flex items-center gap-2">
          <UserCog className="h-4 w-4" />
          Manage Roles
        </span>
      ),
      children: renderRolesTab(),
    },
  ];

  return (
    <div className="p-6">
      <div className="space-y-6">
        {/* Header Section */}
        <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
          <div className="flex justify-between items-center flex-wrap gap-4">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-green-600 rounded-xl flex items-center justify-center shadow-lg shadow-green-500/20">
                <Shield className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Authorizations</h1>
                <p className="text-gray-500">
                  Manage roles and module-level access permissions
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={handleRefresh}
                disabled={refreshing}
                className="flex items-center gap-2 px-4 py-2.5 border border-gray-200 rounded-xl hover:bg-gray-50 disabled:opacity-50 transition-colors"
              >
                <RefreshCw className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`} />
                <span>Refresh</span>
              </button>
              {activeTab === "by-user" && (
                <button
                  onClick={handleSaveHierarchicalPermissions}
                  disabled={saving || !hasChanges || !selectedUser}
                  className="flex items-center gap-2 px-5 py-2.5 bg-green-600 text-white rounded-xl hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-green-600/20 transition-colors"
                >
                  {saving ? (
                    <RefreshCw className="h-4 w-4 animate-spin" />
                  ) : (
                    <Save className="h-4 w-4" />
                  )}
                  <span>Save Changes</span>
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Tabs Section */}
        <Tabs
          activeKey={activeTab}
          onChange={(key) => {
            setActiveTab(key as TabKey);
            setHasChanges(false);
          }}
          items={tabItems}
          className="authorization-tabs"
        />
      </div>

      {/* Role Modal */}
      <Modal
        title={roleModalMode === "create" ? "Create New Role" : "Edit Role"}
        open={roleModalVisible}
        onCancel={() => setRoleModalVisible(false)}
        footer={[
          <button
            key="cancel"
            onClick={() => setRoleModalVisible(false)}
            className="px-4 py-2 border border-gray-200 rounded-lg text-gray-700 hover:bg-gray-50 mr-2"
          >
            Cancel
          </button>,
          <button
            key="submit"
            onClick={handleRoleSubmit}
            disabled={saving}
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
          >
            {saving ? "Saving..." : roleModalMode === "create" ? "Create Role" : "Update Role"}
          </button>,
        ]}
      >
        <Form form={roleForm} layout="vertical" className="mt-4">
          <Form.Item
            name="role_name"
            label="Role Name"
            rules={[{ required: true, message: "Please enter a role name" }]}
          >
            <Input placeholder="e.g., Manager, Supervisor" />
          </Form.Item>
          <Form.Item name="role_code" label="Role Code">
            <Input placeholder="e.g., MGR001" />
          </Form.Item>
          <Form.Item name="description" label="Description">
            <Input.TextArea rows={3} placeholder="Describe this role's responsibilities" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default AuthorizationsPage;
