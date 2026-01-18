import { User } from "@/types/type";
import useSWR from "swr";

const useCurrentUser = () => {
  const { data, error, isLoading, mutate } = useSWR<User>("/user/me");
  return { data, error, isLoading, mutate };
};

export default useCurrentUser;
