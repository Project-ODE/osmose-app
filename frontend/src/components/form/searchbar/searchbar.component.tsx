import React, { HTMLAttributes, useEffect, useRef, useState } from "react";
import { IonItem, IonList, IonSearchbar } from "@ionic/react";
import { Item } from "@/types/item.ts";
import './searchbar.component.css';
import { searchFilter } from "@/services/utils/search.ts";

interface Props {
  placeholder: string;
  values: Array<Item>;
  onValueSelected: (value: Item) => void;
}

export const Searchbar: React.FC<Props & HTMLAttributes<HTMLIonSearchbarElement>> = (props) => {
  const searchbarRef = useRef<HTMLIonSearchbarElement | null>(null);

  const [search, setSearch] = useState<string>();
  const [searchResult, setSearchResult] = useState<Array<any>>([]);

  useEffect(() => setSearchResult(searchFilter(props.values, search)), [search])

  return (
    <div id="searchbar" className={ !search ? '' : 'got-results' }>
      <IonSearchbar { ...props }
                    placeholder={ props.placeholder }
                    ref={ searchbarRef }
                    value={ search }
                    onIonInput={ e => setSearch(e.detail.value ?? undefined) }></IonSearchbar>

      { !!search && <IonList id="searchbar-results" lines="none">
        { (searchResult.length > 5 ? searchResult.slice(0, 4) : searchResult.slice(0, 5)).map((v, i) => (
          <IonItem key={ i } onClick={ () => {
            setSearch(undefined);
            props.onValueSelected(v)
          } }>{ v.label }</IonItem>
        )) }
        { searchResult.length > 5 && <IonItem className="none">{ searchResult.length - 4 } more results</IonItem> }
        { searchResult.length === 0 && <IonItem className="none">No results</IonItem> }
      </IonList> }

    </div>
  )
}
