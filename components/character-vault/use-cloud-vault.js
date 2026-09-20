"use client";
import { useState, useEffect, useCallback, useRef } from "react";
import { createCloudSaveClient, SAVE_TYPES, QuotaExceededError, RevisionConflictError } from "../../lib/cloud-save-service.mjs";
import { parseOmwSave } from "../../lib/omwsave-parser.mjs";
import { duplicateCloudSave, generateBuildShareUrl } from "../../lib/character-vault.mjs";

const LOCAL_SAVES_KEY = "siltstrider-saved-characters";

export function useCloudVault({ activeBuild, onApplyBuild } = {}) {
  const [isOpen, setIsOpen] = useState(false);
  const [signedIn, setSignedIn] = useState(false);
  const [user, setUser] = useState(null);
  const [saves, setSaves] = useState([]);
  const [entitlements, setEntitlements] = useState({
    tier: "free",
    maxSaves: 5,
    currentSaves: 0,
    remainingSaves: 5,
  });
  const [localSaves, setLocalSaves] = useState([]);
  const [loading, setLoading] = useState(false);
  const [actionBusy, setActionBusy] = useState(false);
  const [statusMessage, setStatusMessage] = useState(null);
  const [errorMessage, setErrorMessage] = useState(null);

  const clientRef = useRef(null);

  // Initialize client once or when token provider is called
  if (!clientRef.current) {
    clientRef.current = createCloudSaveClient({
      baseUrl: "",
      getToken: async () => {
        if (typeof window === "undefined") return null;
        if (window.siltStriderAuth?.getToken) {
          try {
            const tok = await window.siltStriderAuth.getToken();
            if (tok) return tok;
          } catch {}
        }
        if (window.Clerk?.session?.getToken) {
          try {
            return await window.Clerk.session.getToken();
          } catch {}
        }
        return null;
      },
    });
  }

  // Check auth state and listen for Clerk changes
  useEffect(() => {
    if (typeof window === "undefined") return;

    function checkAuth() {
      const clerk = window.Clerk;
      const isAuth = Boolean(clerk?.user && clerk?.session);
      setSignedIn(isAuth);
      if (isAuth && clerk.user) {
        setUser({
          id: clerk.user.id,
          name: clerk.user.fullName || clerk.user.firstName || clerk.user.username || "Adventurer",
          email: clerk.user.primaryEmailAddress?.emailAddress || "",
        });
      } else {
        setUser(null);
      }
      return isAuth;
    }

    checkAuth();

    // Listen to clerk auth listener if available
    let listener = null;
    if (window.Clerk?.addListener) {
      try {
        window.Clerk.addListener((state) => {
          const isAuth = Boolean(state?.user && state?.session);
          setSignedIn(isAuth);
          if (isAuth && state.user) {
            setUser({
              id: state.user.id,
              name: state.user.fullName || state.user.firstName || state.user.username || "Adventurer",
              email: state.user.primaryEmailAddress?.emailAddress || "",
            });
          } else {
            setUser(null);
          }
        });
      } catch {}
    }

    // Also listen for modal trigger custom event
    const handleOpenVault = () => setIsOpen(true);
    const handleCloseVault = () => setIsOpen(false);
    window.addEventListener("silt-open-vault", handleOpenVault);
    window.addEventListener("silt-close-vault", handleCloseVault);

    return () => {
      window.removeEventListener("silt-open-vault", handleOpenVault);
      window.removeEventListener("silt-close-vault", handleCloseVault);
    };
  }, []);

  // Load local saves from localStorage
  const refreshLocalSaves = useCallback(() => {
    if (typeof window === "undefined") return;
    try {
      const raw = window.localStorage.getItem(LOCAL_SAVES_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) {
          setLocalSaves(parsed);
        } else if (parsed && Array.isArray(parsed.records)) {
          setLocalSaves(parsed.records);
        }
      } else {
        setLocalSaves([]);
      }
    } catch {
      setLocalSaves([]);
    }
  }, []);

  // Refresh cloud saves and entitlements
  const refreshCloudSaves = useCallback(async () => {
    if (!signedIn || !clientRef.current) {
      return;
    }
    setLoading(true);
    setErrorMessage(null);
    try {
      const [savesRes, entRes] = await Promise.all([
        clientRef.current.listSaves({ limit: 100 }),
        clientRef.current.getEntitlements().catch(() => null),
      ]);

      setSaves(savesRes?.saves || []);
      if (entRes?.entitlements) {
        setEntitlements(entRes.entitlements);
      }
    } catch (err) {
      console.warn("Cloud vault fetch error:", err);
      setErrorMessage(err.message || "Could not load cloud saves");
    } finally {
      setLoading(false);
    }
  }, [signedIn]);

  // Refresh when signedIn or isOpen changes
  useEffect(() => {
    refreshLocalSaves();
    if (signedIn && isOpen) {
      refreshCloudSaves();
    }
  }, [signedIn, isOpen, refreshLocalSaves, refreshCloudSaves]);

  // Save current active build to cloud
  const saveActiveBuild = useCallback(
    async (saveName) => {
      if (!signedIn) {
        setErrorMessage("Please sign in to save to your Cloud Vault");
        return { success: false, error: "UNAUTHORIZED" };
      }
      if (!activeBuild) {
        setErrorMessage("No active build to save");
        return { success: false, error: "NO_BUILD" };
      }

      const name = (saveName || activeBuild.name || activeBuild.className || "Custom Build").trim();
      setActionBusy(true);
      setErrorMessage(null);
      setStatusMessage("Packing and uploading character build…");

      try {
        const payload = {
          build: activeBuild,
          exportedAt: new Date().toISOString(),
          version: 1,
        };

        const res = await clientRef.current.createSave({
          saveType: SAVE_TYPES.CHARACTER_BUILD,
          data: payload,
          name,
        });

        setStatusMessage(`Character "${name}" saved to Cloud Vault!`);
        setTimeout(() => setStatusMessage(null), 3000);
        await refreshCloudSaves();
        return { success: true, save: res?.save };
      } catch (err) {
        const msg = err instanceof QuotaExceededError
          ? `Quota exceeded: Free accounts are limited to ${entitlements.maxSaves} saves. Delete or overwrite a save to make room.`
          : (err.message || "Failed to save character to cloud");
        setErrorMessage(msg);
        return { success: false, error: msg };
      } finally {
        setActionBusy(false);
      }
    },
    [signedIn, activeBuild, entitlements.maxSaves, refreshCloudSaves]
  );

  // Upload a .omwsave or .json file
  const uploadSaveFile = useCallback(
    async (file) => {
      if (!signedIn) {
        setErrorMessage("Please sign in to upload saves to your Cloud Vault");
        return { success: false, error: "UNAUTHORIZED" };
      }

      setActionBusy(true);
      setErrorMessage(null);
      setStatusMessage(`Reading "${file.name}"…`);

      try {
        let saveType = SAVE_TYPES.OPENMW_SAVE;
        let data = null;
        let defaultName = file.name.replace(/\.[^/.]+$/, "");

        if (file.name.endsWith(".omwsave")) {
          setStatusMessage(`Parsing OpenMW binary save "${file.name}"…`);
          const buffer = await file.arrayBuffer();
          data = parseOmwSave(buffer);
          saveType = SAVE_TYPES.OPENMW_SAVE;
          if (data.identity?.name) {
            defaultName = data.identity.name;
          }
        } else if (file.name.endsWith(".json")) {
          setStatusMessage(`Parsing JSON save "${file.name}"…`);
          const text = await file.text();
          data = JSON.parse(text);

          if (data.identity && data.stuff) {
            saveType = SAVE_TYPES.OPENMW_SAVE;
            if (data.identity.name) defaultName = data.identity.name;
          } else if (data.build || (data.race && data.className)) {
            saveType = SAVE_TYPES.CHARACTER_BUILD;
            if (data.name) defaultName = data.name;
          } else if (data.majorObjective || data.restrictions) {
            saveType = SAVE_TYPES.CHALLENGE_RUN;
            if (data.name) defaultName = data.name;
          }
        } else {
          throw new Error("Unsupported file format. Please select an OpenMW save (.omwsave) or JSON file (.json).");
        }

        setStatusMessage(`Compressing and uploading "${defaultName}"…`);
        const res = await clientRef.current.createSave({
          saveType,
          data,
          name: defaultName,
        });

        setStatusMessage(`Uploaded "${defaultName}" successfully!`);
        setTimeout(() => setStatusMessage(null), 3000);
        await refreshCloudSaves();
        return { success: true, save: res?.save };
      } catch (err) {
        const msg = err instanceof QuotaExceededError
          ? `Quota exceeded: Your account limit of ${entitlements.maxSaves} saves has been reached.`
          : (err.message || "Failed to upload save file");
        setErrorMessage(msg);
        return { success: false, error: msg };
      } finally {
        setActionBusy(false);
      }
    },
    [signedIn, entitlements.maxSaves, refreshCloudSaves]
  );

  // Sync a local save record into cloud
  const importLocalSave = useCallback(
    async (localRecord) => {
      if (!signedIn) {
        setErrorMessage("Please sign in to upload local saves to Cloud Vault");
        return { success: false, error: "UNAUTHORIZED" };
      }

      setActionBusy(true);
      setErrorMessage(null);
      setStatusMessage(`Syncing local character "${localRecord.name}" to Cloud…`);

      try {
        const data = {
          build: localRecord.character || localRecord,
          exportedAt: localRecord.updatedAt || new Date().toISOString(),
          version: 1,
        };

        const res = await clientRef.current.createSave({
          saveType: SAVE_TYPES.CHARACTER_BUILD,
          data,
          name: localRecord.name || "Local Character",
        });

        setStatusMessage(`Synced "${localRecord.name}" to Cloud Vault!`);
        setTimeout(() => setStatusMessage(null), 3000);
        await refreshCloudSaves();
        return { success: true, save: res?.save };
      } catch (err) {
        const msg = err instanceof QuotaExceededError
          ? `Quota exceeded (${entitlements.maxSaves} saves limit).`
          : (err.message || "Failed to sync local save");
        setErrorMessage(msg);
        return { success: false, error: msg };
      } finally {
        setActionBusy(false);
      }
    },
    [signedIn, entitlements.maxSaves, refreshCloudSaves]
  );

  // Rename a save
  const renameSave = useCallback(
    async (id, newName, revision) => {
      if (!newName || !newName.trim()) return;
      setActionBusy(true);
      setErrorMessage(null);
      try {
        await clientRef.current.renameSave(id, newName.trim(), revision);
        setStatusMessage("Save renamed successfully.");
        setTimeout(() => setStatusMessage(null), 2500);
        await refreshCloudSaves();
        return { success: true };
      } catch (err) {
        const msg = err instanceof RevisionConflictError
          ? "Save was modified in another session. Please reload."
          : (err.message || "Failed to rename save");
        setErrorMessage(msg);
        return { success: false, error: msg };
      } finally {
        setActionBusy(false);
      }
    },
    [refreshCloudSaves]
  );

  // Delete a save
  const deleteSave = useCallback(
    async (id, revision) => {
      setActionBusy(true);
      setErrorMessage(null);
      try {
        await clientRef.current.deleteSave(id, { revision });
        setStatusMessage("Save deleted.");
        setTimeout(() => setStatusMessage(null), 2500);
        await refreshCloudSaves();
        return { success: true };
      } catch (err) {
        const msg = err.message || "Failed to delete save";
        setErrorMessage(msg);
        return { success: false, error: msg };
      } finally {
        setActionBusy(false);
      }
    },
    [refreshCloudSaves]
  );

  // Load a save into active session
  const loadSaveIntoSession = useCallback(
    async (id) => {
      setActionBusy(true);
      setErrorMessage(null);
      setStatusMessage("Fetching save data from Cloud Vault…");
      try {
        const res = await clientRef.current.getSave(id);
        const save = res?.save;
        if (!save) throw new Error("Save not found");

        const data = save.data;
        let buildToApply = null;

        if (save.save_type === SAVE_TYPES.CHARACTER_BUILD) {
          buildToApply = data.build || data;
        } else if (save.save_type === SAVE_TYPES.OPENMW_SAVE) {
          // Extract build representation from OpenMW save
          const ident = data.identity || {};
          const bld = data.build || {};
          const skills = bld.skills || [];

          const maj = skills.filter((s) => s.kind === "Major").map((s) => s.id);
          const min = skills.filter((s) => s.kind === "Minor").map((s) => s.id);

          buildToApply = {
            version: 1,
            name: ident.name || save.name || "OpenMW Character",
            race: ident.race || "Dark Elf",
            gender: "Male",
            className: ident.class?.name || ident.class?.id || "Custom",
            sign: ident.birthsign || "The Lady",
            spec: "Combat",
            fav1: "Strength",
            fav2: "Endurance",
            maj: maj.length >= 5 ? maj.slice(0, 5) : ["Long Blade", "Heavy Armor", "Block", "Armorer", "Athletics"],
            min: min.length >= 5 ? min.slice(0, 5) : ["Restoration", "Medium Armor", "Spear", "Mercantile", "Speechcraft"],
            bitterCup: false,
          };
        }

        if (buildToApply) {
          if (typeof onApplyBuild === "function") {
            onApplyBuild(buildToApply);
          } else if (typeof window !== "undefined" && window.siltShell?.navigate) {
            window.siltShell.navigate("builder");
          }
          setStatusMessage(`Loaded "${save.name}" into Character Builder!`);
          setTimeout(() => {
            setStatusMessage(null);
            setIsOpen(false);
          }, 1200);
          return { success: true, build: buildToApply };
        } else {
          throw new Error("This save type does not contain a playable character build.");
        }
      } catch (err) {
        const msg = err.message || "Failed to load save";
        setErrorMessage(msg);
        return { success: false, error: msg };
      } finally {
        setActionBusy(false);
      }
    },
    [onApplyBuild]
  );

  // Export save as JSON file download
  const exportSaveJson = useCallback(
    async (id, saveName) => {
      setActionBusy(true);
      setErrorMessage(null);
      setStatusMessage("Preparing export download…");
      try {
        const res = await clientRef.current.getSave(id);
        const save = res?.save;
        if (!save) throw new Error("Save not found");

        const jsonStr = JSON.stringify(save.data, null, 2);
        const blob = new Blob([jsonStr], { type: "application/json" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `${(saveName || save.name || "morrowind-save").replace(/\s+/g, "_")}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);

        setStatusMessage("Export downloaded!");
        setTimeout(() => setStatusMessage(null), 2500);
        return { success: true };
      } catch (err) {
        const msg = err.message || "Failed to export save";
        setErrorMessage(msg);
        return { success: false, error: msg };
      } finally {
        setActionBusy(false);
      }
    },
    []
  );

  const duplicateSave = useCallback(
    async (id) => {
      setActionBusy(true);
      setErrorMessage(null);
      setStatusMessage("Duplicating save in Cloud Vault…");
      try {
        const res = await duplicateCloudSave(clientRef.current, id);
        setStatusMessage(`Created duplicate save: "${res.save?.name}"!`);
        setTimeout(() => setStatusMessage(null), 3000);
        await refreshCloudSaves();
        return { success: true, save: res.save };
      } catch (err) {
        const msg = err instanceof QuotaExceededError
          ? `Quota exceeded (${entitlements.maxSaves} saves limit).`
          : (err.message || "Failed to duplicate save");
        setErrorMessage(msg);
        return { success: false, error: msg };
      } finally {
        setActionBusy(false);
      }
    },
    [entitlements.maxSaves, refreshCloudSaves]
  );

  const shareBuildLink = useCallback(
    async (save) => {
      try {
        let build = null;
        if (save.save_type === SAVE_TYPES.CHARACTER_BUILD) {
          const res = await clientRef.current.getSave(save.id);
          build = res?.save?.data?.build || res?.save?.data;
        } else {
          build = {
            race: save.race || "Dark Elf",
            className: save.class_name || "Custom",
            sign: save.birthsign || "The Lady",
          };
        }
        const origin = typeof window !== "undefined" ? window.location.origin : "";
        const url = generateBuildShareUrl(build, origin);
        if (typeof navigator !== "undefined" && navigator.clipboard?.writeText) {
          await navigator.clipboard.writeText(url);
          setStatusMessage("Share link copied to clipboard!");
          setTimeout(() => setStatusMessage(null), 2500);
        }
        return { success: true, url };
      } catch (err) {
        setErrorMessage(err.message || "Failed to generate share link");
        return { success: false };
      }
    },
    []
  );

  const openSignIn = useCallback(() => {
    if (typeof window !== "undefined" && window.Clerk?.openSignIn) {
      window.Clerk.openSignIn({ forceRedirectUrl: window.location.href });
    }
  }, []);

  const openSignUp = useCallback(() => {
    if (typeof window !== "undefined" && window.Clerk?.openSignUp) {
      window.Clerk.openSignUp({ forceRedirectUrl: window.location.href });
    }
  }, []);

  return {
    isOpen,
    openModal: () => setIsOpen(true),
    closeModal: () => setIsOpen(false),
    signedIn,
    user,
    saves,
    entitlements,
    localSaves,
    loading,
    actionBusy,
    statusMessage,
    errorMessage,
    refreshCloudSaves,
    refreshLocalSaves,
    saveActiveBuild,
    uploadSaveFile,
    importLocalSave,
    renameSave,
    deleteSave,
    duplicateSave,
    shareBuildLink,
    loadSaveIntoSession,
    exportSaveJson,
    openSignIn,
    openSignUp,
  };
}
