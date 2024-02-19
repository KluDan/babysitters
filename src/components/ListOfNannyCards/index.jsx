import { useState, useEffect } from "react";
import { db } from "../../firebase";
import {
  ref,
  onValue,
  query,
  startAfter,
  limitToFirst,
  orderByKey,
} from "firebase/database";
import CardNanny from "../CardNanny";
import { StyledList, ListSection } from "./ListOfNannyCards.styled";
import Button from "../Button";

const NannyList = ({ sortBy }) => {
  const [nannies, setNannies] = useState([]);
  const [lastVisibleIndex, setLastVisibleIndex] = useState(null);
  const [allNanniesLoaded, setAllNanniesLoaded] = useState(false);

  useEffect(() => {
    const dataRef = ref(db, "/nannies");

    const initialQuery = query(dataRef, orderByKey(), limitToFirst(3));

    const unsubscribe = onValue(initialQuery, (snapshot) => {
      const data = snapshot.val();
      if (data !== null) {
        const nanniesArray = Object.values(data);
        setNannies(nanniesArray);

        const lastIndex = parseInt(
          Object.keys(data)[Object.keys(data).length - 1]
        );
        setLastVisibleIndex(lastIndex);
      }
    });

    return () => {
      unsubscribe();
    };
  }, []);

  const loadMoreData = () => {
    if (!lastVisibleIndex) return;

    const dataRef = ref(db, "/nannies");

    const nextDataRef = query(
      dataRef,
      orderByKey(),
      startAfter(lastVisibleIndex.toString()),
      limitToFirst(3)
    );

    const unsubscribe = onValue(nextDataRef, (snapshot) => {
      const data = snapshot.val();

      if (data !== null) {
        const nanniesArray = Object.values(data);
        setNannies((prevNannies) => [...prevNannies, ...nanniesArray]);

        const lastIndex = parseInt(
          Object.keys(data)[Object.keys(data).length - 1]
        );
        setLastVisibleIndex(lastIndex);
        if (Object.keys(data).length < 3) {
          setAllNanniesLoaded(true);
        }
      }
    });

    return unsubscribe;
  };

  const sortedNannies = [...nannies].sort((a, b) => {
    switch (sortBy) {
      case "a-z":
        return a.name.localeCompare(b.name);
      case "z-a":
        return b.name.localeCompare(a.name);
      case "asc":
        return a.price_per_hour - b.price_per_hour;
      case "desc":
        return b.price_per_hour - a.price_per_hour;
      case "popular":
        return b.rating - a.rating;
      case "not-popular":
        return a.rating - b.rating;
      case "show-all":
      default:
        return 0;
    }
  });
  console.log("sortedNannies", sortedNannies);

  return (
    <ListSection>
      <StyledList>
        {sortedNannies.map((nanny) => (
          <CardNanny key={nanny.id} nanny={nanny} />
        ))}
      </StyledList>
      {!allNanniesLoaded && (
        <Button
          title="Load More"
          border={false}
          padding="14px 40px"
          onClick={loadMoreData}
        />
      )}
    </ListSection>
  );
};

export default NannyList;
